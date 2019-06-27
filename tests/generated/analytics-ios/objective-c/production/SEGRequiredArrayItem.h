/**
 *  This client was automatically generated by Segment Typewriter. ** Do Not Edit **
 */

#import <Foundation/Foundation.h>
#import <Analytics/SEGSerializableValue.h>
#import "SEGTypewriterSerializable.h"
#import "SEGTypewriterUtils.h"

@interface SEGRequiredArrayItem : NSObject<SEGTypewriterSerializable>

/// Optional sub-property
@property (strong, nonatomic, nullable) NSString *optionalSubProperty;
/// Required sub-property
@property (strong, nonatomic, nullable) NSString *requiredSubProperty;

+(nonnull instancetype) initWithOptionalSubProperty:(nullable NSString *)optionalSubProperty
requiredSubProperty:(nonnull NSString *)requiredSubProperty;

-(nonnull SERIALIZABLE_DICT) toDictionary;

@end
