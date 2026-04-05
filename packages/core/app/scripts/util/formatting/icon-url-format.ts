// @ts-ignore -- kdbxweb has no type declarations
import * as kdbxweb from 'kdbxweb';

const IconUrlFormat = {
    toDataUrl(iconData: Uint8Array | null | undefined): string | null {
        return iconData
            ? 'data:image/png;base64,' + kdbxweb.ByteUtils.bytesToBase64(iconData)
            : null;
    }
};

export { IconUrlFormat };
