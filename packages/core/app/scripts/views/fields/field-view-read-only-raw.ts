import { FieldView } from 'views/fields/field-view';

class FieldViewReadOnlyRaw extends FieldView {
    readonly = true;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renderValue(value: any): any {
        return value;
    }
}

export { FieldViewReadOnlyRaw };
