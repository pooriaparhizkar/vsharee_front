import { toPascalCase } from '../scripts';

export function _objectToFormData(obj: Record<string, any>): FormData {
    const formData = new FormData();

    for (const key in obj) {
        if (obj[key]) {
            const pascalKey = toPascalCase(key); // Convert key to PascalCase

            // Check if the value is an array
            if (Array.isArray(obj[key])) {
                // Explicitly type the value parameter as any
                obj[key].forEach((value: any) => {
                    formData.append(`${pascalKey}[]`, value); // Append array values with a key suffix
                });
            } else {
                formData.append(pascalKey, obj[key]); // Append single values
            }
        }
    }
    return formData;
}
