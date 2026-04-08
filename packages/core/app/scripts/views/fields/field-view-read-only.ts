import { FieldView } from 'views/fields/field-view';
import { escape } from 'util/fn';

class FieldViewReadOnly extends FieldView {
    readonly = true;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renderValue(value: any): string {
        let rendered = value?.isProtected
            ? new Array(value.textLength + 1).join('\u2022')
            : escape(value);
        rendered = rendered.replace(/\n/g, '<br/>');
        return rendered;
    }
}

export { FieldViewReadOnly };
