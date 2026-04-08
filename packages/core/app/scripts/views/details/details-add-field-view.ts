import { View } from 'framework/views/view';
import template from 'templates/details/details-add-field.hbs';

class DetailsAddFieldView extends View {
    parent = '.details__body-fields';

    template = template;

    events: Record<string, string> = {
        'click .details__field-label': 'fieldLabelClick',
        'click .details__field-value': 'fieldValueClick'
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    labelEl: any;

    render(): this | undefined {
        super.render();
        this.labelEl = this.$el.find('.details__field-label');
        return this;
    }

    fieldLabelClick(): void {
        this.emit('more-click');
    }

    fieldValueClick(): void {
        this.emit('add-field');
    }
}

export { DetailsAddFieldView };
