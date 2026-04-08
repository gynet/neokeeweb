import { View } from 'framework/views/view';
import { Events } from 'framework/events';
import { GeneratorPresets } from 'comp/app/generator-presets';
import { CopyPaste } from 'comp/browser/copy-paste';
import { AppSettingsModel } from 'models/app-settings-model';
import { PasswordGenerator } from 'util/generators/password-generator';
import { PasswordPresenter } from 'util/formatting/password-presenter';
import { Locale } from 'util/locale';
import { Tip } from 'util/ui/tip';
import template from 'templates/generator.hbs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const loc = Locale as unknown as Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const genPresets = GeneratorPresets as unknown as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const passGen = PasswordGenerator as unknown as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const settings = AppSettingsModel as unknown as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const copyPaste = CopyPaste as unknown as any;

interface GeneratorPreset {
    name: string;
    title: string;
    length?: number;
    default?: boolean;
    pseudoLength?: number;
    [key: string]: unknown;
}

class GeneratorView extends View {
    parent = 'body';

    template = template;

    events: Record<string, string> = {
        'click': 'click',
        'mousedown .gen__length-range': 'generate',
        'input .gen__length-range': 'lengthChange',
        'change .gen__length-range': 'lengthChange',
        'change .gen__check input[type=checkbox]': 'checkChange',
        'change .gen__check-hide': 'hideChange',
        'click .gen__btn-ok': 'btnOkClick',
        'change .gen__sel-tpl': 'presetChange',
        'click .gen__btn-refresh': 'newPass'
    };

    valuesMap: number[] = [
        3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 24, 26, 28, 30,
        32, 48, 64
    ];

    presets: GeneratorPreset[] = [];
    preset: string | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gen: any = {};
    hidePass = false;
    password = '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resultEl: any;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(model: any) {
        super(model);
        this.createPresets();
        const preset = this.preset;
        this.gen = { ...this.presets.find((pr) => pr.name === preset) };
        this.hidePass = !!settings.generatorHidePassword;
        $('body').one('click', this.remove.bind(this));
        this.listenTo(Events, 'lock-workspace', this.remove.bind(this));
    }

    render(): this | undefined {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const canCopy = (document as any).queryCommandSupported
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (document as any).queryCommandSupported('copy')
            : false;
        const btnTitle = this.model.copy
            ? canCopy
                ? loc.alertCopy
                : loc.alertClose
            : loc.alertOk;
        super.render({
            btnTitle,
            showToggleButton: this.model.copy,
            opt: this.gen,
            hide: this.hidePass,
            presets: this.presets,
            preset: this.preset,
            showTemplateEditor: !this.model.noTemplateEditor
        });
        this.resultEl = this.$el.find('.gen__result');
        this.$el.css(this.model.pos);
        this.generate();
        return this;
    }

    createPresets(): void {
        this.presets = (genPresets.enabled as GeneratorPreset[]).slice();
        if (
            this.model.password &&
            (!this.model.password.isProtected || this.model.password.byteLength)
        ) {
            const derivedPreset: GeneratorPreset = {
                name: 'Derived',
                title: loc.genPresetDerived as string
            };
            Object.assign(derivedPreset, passGen.deriveOpts(this.model.password));
            this.presets.splice(0, 0, derivedPreset);
            this.preset = 'Derived';
        } else {
            const defaultPreset = this.presets.filter((p) => p.default)[0] || this.presets[0];
            this.preset = defaultPreset.name;
        }
        this.presets.forEach((pr) => {
            pr.pseudoLength = this.lengthToPseudoValue(pr.length ?? 0);
        });
    }

    lengthToPseudoValue(length: number): number {
        for (let ix = 0; ix < this.valuesMap.length; ix++) {
            if (this.valuesMap[ix] >= length) {
                return ix;
            }
        }
        return this.valuesMap.length - 1;
    }

    showPassword(): void {
        if (this.hidePass && !this.model.copy) {
            this.resultEl.text(PasswordPresenter.present(this.password.length));
        } else {
            this.resultEl.text(this.password);
        }
    }

    click(e: Event): void {
        e.stopPropagation();
    }

    lengthChange(e: Event): void {
        const target = e.target as HTMLInputElement;
        const val = this.valuesMap[+target.value];
        if (val !== this.gen.length) {
            this.gen.length = val;
            this.$el.find('.gen__length-range-val').text(val);
            this.optionChanged('length');
            this.generate();
        }
    }

    checkChange(e: Event): void {
        const target = e.target as HTMLInputElement;
        const id = $(target).data('id') as string | undefined;
        if (id) {
            this.gen[id] = target.checked;
        }
        this.optionChanged(id);
        this.generate();
    }

    optionChanged(option?: string): void {
        if (
            this.preset === 'Custom' ||
            (this.preset === 'Pronounceable' &&
                option !== undefined &&
                ['length', 'lower', 'upper'].indexOf(option) >= 0)
        ) {
            return;
        }
        this.preset = this.gen.name = 'Custom';
        this.$el.find('.gen__sel-tpl').val('');
    }

    generate(): void {
        this.password = passGen.generate(this.gen) as string;
        this.showPassword();
        const isLong = this.password.length > 32;
        this.resultEl.toggleClass('gen__result--long-pass', isLong);
    }

    hideChange(e: Event): void {
        this.hidePass = (e.target as HTMLInputElement).checked;
        settings.generatorHidePassword = this.hidePass;
        const label = this.$el.find('.gen__check-hide-label');
        Tip.updateTip(label[0], {
            title: this.hidePass
                ? (loc.genShowPass as string)
                : (loc.genHidePass as string)
        });
        this.showPassword();
    }

    btnOkClick(): void {
        if (this.model.copy) {
            if (!copyPaste.simpleCopy) {
                copyPaste.createHiddenInput(this.password);
            }
            copyPaste.copy(this.password);
        }
        this.emit('result', this.password);
        this.remove();
    }

    presetChange(e: Event): void {
        const name = (e.target as HTMLSelectElement).value;
        if (name === '...') {
            Events.emit('edit-generator-presets');
            this.remove();
            return;
        }
        this.preset = name;
        const preset = this.presets.find((t) => t.name === name);
        this.gen = { ...preset };
        this.render();
    }

    newPass(): void {
        this.generate();
    }
}

export { GeneratorView };
