/**
 * This client was automatically generated by Segment Typewriter. ** Do Not Edit **
 */

#import <Foundation/Foundation.h>
#import <Analytics/SEGSerializableValue.h>
#import "SEGTypewriterSerializable.h"
#import "SEGTypewriterUtils.h"

@interface SEGSubterraneanLab : NSObject<SEGTypewriterSerializable>

@property (strong, nonatomic, nullable) NSString *summersContingencyPlan;
@property (strong, nonatomic, nullable) NSArray<id> *jerrysMemories;
@property (strong, nonatomic, nullable) NSArray<id> *mortysMemories;

+(nonnull instancetype) initWithSummersContingencyPlan:(nullable NSString *)summersContingencyPlan
jerrysMemories:(nullable NSArray<id> *)jerrysMemories
mortysMemories:(nullable NSArray<id> *)mortysMemories;

-(nonnull SERIALIZABLE_DICT) toDictionary;

@end
