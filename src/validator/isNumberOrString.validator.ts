import { registerDecorator, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, ValidationOptions } from "class-validator";
import { ClassConstructor } from "class-transformer";

export const IsNumberOrString = <T>(property: string, validationOptions?: ValidationOptions) => {
    return (object: any, propertyName: string) => {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [property],
            validator: IsNumberOrStringConstraint,
        });
    };
};

@ValidatorConstraint({ name: "IsNumberOrString", async: false })
export class IsNumberOrStringConstraint implements ValidatorConstraintInterface {
    validate(value: any, args: ValidationArguments) {
        return typeof value === "number" || typeof value === "string";
    }

    defaultMessage(args: ValidationArguments) {
        return `${args.property} Value is need string or number `;
    }
}
