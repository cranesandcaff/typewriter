/**
 * This client was automatically generated by Segment Typewriter. ** Do Not Edit **
 */

#import "SEGSubterraneanLab.h"

@implementation SEGSubterraneanLab

+(nonnull instancetype) initWithMortysMemories:(nullable NSArray<id> *)mortysMemories
summersContingencyPlan:(nullable NSString *)summersContingencyPlan
jerrysMemories:(nullable NSArray<id> *)jerrysMemories {
  SEGSubterraneanLab *object = [[SEGSubterraneanLab alloc] init];
  object.mortysMemories = mortysMemories;
  object.summersContingencyPlan = summersContingencyPlan;
  object.jerrysMemories = jerrysMemories;
  return object;
}

-(nonnull SERIALIZABLE_DICT) toDictionary {
  NSMutableDictionary *properties = [[NSMutableDictionary alloc] init];
  if (self.mortysMemories != nil) {
    properties[@"morty's memories"] = [SEGTypewriterUtils toSerializableArray:self.mortysMemories];
  }
  if (self.summersContingencyPlan != nil) {
    properties[@"summer's contingency plan"] = self.summersContingencyPlan;
  }
  if (self.jerrysMemories != nil) {
    properties[@"jerry's memories"] = [SEGTypewriterUtils toSerializableArray:self.jerrysMemories];
  }

  return properties;
}

@end
