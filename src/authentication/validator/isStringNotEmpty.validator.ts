import { registerDecorator, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, ValidationOptions } from "class-validator";
import { ClassConstructor } from "class-transformer";
import { isEmpty } from "src/service/utils.service";

export const IsStringNotEmpty = <T>(property: string, validationOptions?: ValidationOptions) => {
    return (object: any, propertyName: string) => {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [property],
            validator: IsStringNotEmptyConstraint,
        });
    };
};
/**
 * 判斷是空字串 或 null 時給予通過
 * 判斷是字串值時 給予通過
 */
@ValidatorConstraint({ name: "IsStringNotEmpty", async: false })
export class IsStringNotEmptyConstraint implements ValidatorConstraintInterface {
    validate(value: any) {
        if (isEmpty(value)) {
            return true;
        }
        if (typeof value === "string") {
            return true;
        }
        return false;
    }

    defaultMessage(args: ValidationArguments) {
        const [constraintProperty]: (() => any)[] = args.constraints;
        return `${args.property} is not string`;
    }
}
