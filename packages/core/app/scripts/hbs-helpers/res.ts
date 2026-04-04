/* eslint-disable @typescript-eslint/no-explicit-any */
import Handlebars from 'hbs';
import { Locale } from 'util/locale';

interface HbsBlockOptions {
    fn(context: unknown): string;
}

Handlebars.registerHelper('res', function (this: unknown, key: string, options: HbsBlockOptions): string | undefined {
    let value: string | undefined = (Locale as any)[key];
    if (value) {
        const ix = value.indexOf('{}');
        if (ix >= 0) {
            value = value.replace('{}', options.fn(this));
        }
    }
    return value;
});

Handlebars.registerHelper('Res', (key: string, options: HbsBlockOptions): string | undefined => {
    let value: string | undefined = (Locale as any)[key];
    if (value) {
        value = value[0].toUpperCase() + value.substr(1);
        const ix = value.indexOf('{}');
        if (ix >= 0) {
            value = value.replace('{}', options.fn(undefined));
        }
    }
    return value;
});
