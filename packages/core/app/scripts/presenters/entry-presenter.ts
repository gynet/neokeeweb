/* eslint-disable @typescript-eslint/no-explicit-any */
import { DateFormat } from 'comp/i18n/date-format';
import { Locale } from 'util/locale';

class EntryPresenter {
    entry: any = null;
    group: any = null;
    descField: string;
    noColor: string;
    activeEntryId: string | undefined;

    constructor(descField: string, noColor?: string, activeEntryId?: string) {
        this.descField = descField;
        this.noColor = noColor || '';
        this.activeEntryId = activeEntryId;
    }

    present(item: any): this {
        if (item.entry) {
            this.entry = item;
        } else if (item.group) {
            this.group = item;
        }
        return this;
    }

    reset(): void {
        this.entry = null;
        this.group = null;
    }

    get id(): string {
        return this.entry ? this.entry.id : this.group.id;
    }

    get icon(): string {
        return this.entry ? this.entry.icon : this.group.icon || 'folder';
    }

    get customIcon(): string | undefined {
        return this.entry ? this.entry.customIcon : undefined;
    }

    get color(): string | undefined {
        return this.entry
            ? this.entry.color || (this.entry.customIcon ? this.noColor : undefined)
            : undefined;
    }

    get title(): string {
        return this.entry ? this.entry.title : this.group.title;
    }

    get notes(): string | undefined {
        return this.entry ? this.entry.notes : undefined;
    }

    get url(): string | undefined {
        return this.entry ? this.entry.displayUrl : undefined;
    }

    get user(): string | undefined {
        return this.entry ? this.entry.user : undefined;
    }

    get active(): boolean {
        return this.entry ? this.entry.id === this.activeEntryId : this.group.active;
    }

    get created(): string | undefined {
        return this.entry ? DateFormat.dtStr(this.entry.created) : undefined;
    }

    get updated(): string | undefined {
        return this.entry ? DateFormat.dtStr(this.entry.updated) : undefined;
    }

    get expired(): boolean {
        return this.entry ? this.entry.expired : false;
    }

    get tags(): string[] | undefined {
        return this.entry ? this.entry.tags : undefined;
    }

    get groupName(): string | undefined {
        return this.entry ? this.entry.groupName : undefined;
    }

    get fileName(): string | undefined {
        return this.entry ? this.entry.fileName : undefined;
    }

    get description(): string | undefined {
        if (!this.entry) {
            return '[' + (Locale as any).listGroup + ']';
        }
        if (this.entry.backend === 'otp-device') {
            return this.entry.description;
        }
        switch (this.descField) {
            case 'website':
                return this.url || '(' + (Locale as any).listNoWebsite + ')';
            case 'user':
                return this.user || '(' + (Locale as any).listNoUser + ')';
            case 'created':
                return this.created;
            case 'updated':
                return this.updated;
            case 'attachments':
                return (
                    this.entry.attachments.map((a: any) => a.title).join(', ') ||
                    '(' + (Locale as any).listNoAttachments + ')'
                );
            default:
                return this.user || this.notes || this.url;
        }
    }
}

export { EntryPresenter };
