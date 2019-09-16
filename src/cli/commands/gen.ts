import {
	getToken,
	resolveRelativePath,
	Config,
	TrackingPlanConfig,
	verifyDirectoryExists,
} from '../config'
import { JSONSchema7 } from 'json-schema'
import * as fs from 'fs'
import { promisify } from 'util'
import { fetchTrackingPlan, loadTrackingPlan, writeTrackingPlan, SegmentAPI } from '../api'
import { gen, RawTrackingPlan } from '../../generators/gen'
import { SEGMENT_AUTOGENERATED_FILE_WARNING } from '../../templates'
import { join } from 'path'
import * as childProcess from 'child_process'
import { version } from '../../../package.json'

const readFile = promisify(fs.readFile)
const readdir = promisify(fs.readdir)
const writeFile = promisify(fs.writeFile)
const unlink = promisify(fs.unlink)
const exec = promisify(childProcess.exec)

export interface GeneratorState {
	steps: {
		loadPlan: StepState
		clearFiles: StepState
		generateClient: StepState
		afterScript: StepState
	}
}

export interface StepState {
	running: boolean
	done: boolean
	skipping: boolean
	progress?: number
}

export function getInitialState(config: Config): GeneratorState {
	const initialStepState: StepState = {
		running: false,
		done: false,
		skipping: false,
	}

	return {
		steps: {
			loadPlan: { ...initialStepState },
			clearFiles: { ...initialStepState },
			generateClient: { ...initialStepState },
			afterScript: { ...initialStepState, skipping: !config.scripts || !config.scripts.after },
		},
	}
}

export async function* runGenerator(
	configPath: string | undefined,
	config: Config,
	trackingPlanConfig: TrackingPlanConfig,
	genOptions: { production: boolean; update: boolean }
) {
	const state = getInitialState(config)

	// Step 1: Load a Tracking Plan, either from the API or from the `plan.json` file.
	state.steps.loadPlan.running = true
	yield state
	let segmentTrackingPlan: SegmentAPI.TrackingPlan
	if (genOptions.update) {
		// TODO: support fine-grained event updates, by event name and by label.
		// For now, we will just support updating the full tracking plan.
		const token = await getToken(config)
		try {
			segmentTrackingPlan = await fetchTrackingPlan({
				id: trackingPlanConfig.id,
				workspaceSlug: trackingPlanConfig.workspaceSlug,
				token: token!,
			})

			await writeTrackingPlan(configPath, segmentTrackingPlan, trackingPlanConfig)
		} catch (err) {
			// TODO: more reliable network connection detection
			console.error(err)
			console.warn('Skipping update: no network connection')
			// Use the cache instead:
			segmentTrackingPlan = await loadTrackingPlan(configPath, trackingPlanConfig)
		}
	} else {
		segmentTrackingPlan = await loadTrackingPlan(configPath, trackingPlanConfig)
	}

	const trackingPlan: RawTrackingPlan = {
		trackCalls: segmentTrackingPlan.rules.events
			// Typewriter doesn't yet support event versioning. For now, we just choose the most recent version.
			.filter(e =>
				segmentTrackingPlan.rules.events.every(e2 => e.name !== e2.name || e.version >= e2.version)
			)
			.map<JSONSchema7>(e => ({
				...e.rules,
				title: e.name,
				description: e.description,
			})),
	}
	state.steps.loadPlan.running = false
	state.steps.loadPlan.done = true
	yield state

	// Step 2. Remove any previously generated files from the configured path.
	// We identify which files to clear using the `SEGMENT_AUTOGENERATED_FILE_WARNING` at the
	// top of every file.
	state.steps.clearFiles.running = true
	yield state
	const path = resolveRelativePath(configPath, trackingPlanConfig.path)
	await verifyDirectoryExists(path)
	await clearFolder(path)
	state.steps.clearFiles.running = false
	state.steps.clearFiles.done = true
	yield state

	// Step 3: Generate the client and write it to the user's file system.
	state.steps.generateClient.running = true
	yield state
	const files = await gen(trackingPlan, {
		client: config.client,
		typewriterVersion: version,
		isDevelopment: !genOptions.production,
	})
	for (var file of files) {
		const path = resolveRelativePath(configPath, trackingPlanConfig.path, file.path)
		await verifyDirectoryExists(path, 'file')
		await writeFile(path, file.contents, {
			encoding: 'utf-8',
		})
	}
	state.steps.generateClient.running = false
	state.steps.generateClient.done = true
	yield state

	// Step 5: Optionally run the user's scripts.after script, if one was supplied.
	if (!state.steps.afterScript.skipping) {
		state.steps.afterScript.running = true
		yield state
		if (config.scripts && config.scripts.after) {
			await exec(config.scripts.after).catch(err => {
				// TODO: pretty-print these errors (f.e., providing context as to what script ran).
				console.error(err)
			})
		}
		state.steps.afterScript.running = false
		state.steps.afterScript.done = true
		yield state
	}
}

// clearFolder removes all typewriter-generated files from the specified folder
// excluding plan.json.
// It uses a simple heuristic to avoid accidentally clobbering a user's files --
// it only clears files with the "this file was autogenerated by Typewriter" warning.
// Therefore, all generators need to output that warning in a comment in the first few
// lines of every generated file.
async function clearFolder(path: string): Promise<void> {
	const fileNames = await readdir(path, 'utf-8')
	for (let fileName of fileNames) {
		const fullPath = join(path, fileName)
		try {
			const contents = await readFile(fullPath, 'utf-8')
			if (contents.includes(SEGMENT_AUTOGENERATED_FILE_WARNING)) {
				await unlink(fullPath)
			}
		} catch (err) {
			// Note: none of our generators produce folders, but if we ever do, then we'll need to
			// update this logic to handle recursively traversing directores.
			// In the mean time, protect against
			if (err.code !== 'EISDIR') {
				await clearFolder(fullPath)
			}
		}
	}
}
