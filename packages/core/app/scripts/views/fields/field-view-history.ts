import { Locale } from 'util/locale';
import { FieldView } from 'views/fields/field-view';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const loc = Locale as unknown as Record<string, any>;

class FieldViewHistory extends FieldView {
    readonly = true;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renderValue(value: any): string {
        if (!value.length) {
            return loc.detHistoryEmpty as string;
        }
        let text =
            value.length +
            ' ' +
            (value.length === 1
                ? (loc.detHistoryRec as string)
                : (loc.detHistoryRecs as string));
        if (value.unsaved) {
            text += ' (' + (loc.detHistoryModified as string) + ')';
        }
        return '<a class="details__history-link">' + text + '</a>';
    }
}

export { FieldViewHistory };
