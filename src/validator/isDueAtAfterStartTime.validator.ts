import { registerDecorator, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, ValidationOptions } from "class-validator";
import { ClassConstructor } from "class-transformer";

/**
 * 開始時間 大於 結束時間 判斷式
 * @param property
 * @param validationOptions
 * @returns
 */
export const IsDueAtAfterStartTime = <T>(property: string, validationOptions?: ValidationOptions) => {
    return (object: any, propertyName: string) => {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [property],
            validator: IsDueAtAfterStartTimeConstraint,
        });
    };
};

@ValidatorConstraint({ name: "IsDueAtAfterStartTime", async: false })
export class IsDueAtAfterStartTimeConstraint implements ValidatorConstraintInterface {
    validate(value: any, args: ValidationArguments) {
        const [relatedPropertyName] = args.constraints;
        const relatedValue = (args.object as any)[relatedPropertyName];
        return value <= relatedValue;
    }

    defaultMessage(args: ValidationArguments) {
        return `${args.property} 招募截止時間不能大於活動開始時間`;
    }
}
