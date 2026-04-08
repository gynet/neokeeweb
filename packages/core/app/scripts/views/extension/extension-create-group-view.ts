import { View } from 'framework/views/view';
import template from 'templates/extension/extension-create-group.hbs';

interface ExtensionFile {
    id: string;
    selected?: boolean;
}

class ExtensionCreateGroupView extends View {
    template = template;

    events: Record<string, string> = {
        'change #extension-create-group__file': 'fileChanged'
    };

    selectedFile: string;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(model: any) {
        super(model);

        const files = model.files as ExtensionFile[];
        const selected = files.find((f) => f.selected);
        this.selectedFile = selected ? selected.id : '';
    }

    render(): this | undefined {
        super.render(this.model);
        return this;
    }

    fileChanged(e: Event): void {
        this.selectedFile = (e.target as HTMLSelectElement).value;
    }
}

export { ExtensionCreateGroupView };
