import type { FlashMessages } from '@/types/project';

type Props = {
    flash?: FlashMessages;
};

export function FlashMessage({ flash }: Props) {
    if (flash?.success) {
        return (
            <p
                role="status"
                className="border border-[#69702f] bg-[#202218] px-4 py-3 text-sm text-[#e8f06b]"
            >
                {flash.success}
            </p>
        );
    }

    if (flash?.error) {
        return (
            <p
                role="alert"
                className="border border-[#8d4d3b] bg-[#241916] px-4 py-3 text-sm text-[#f2a58d]"
            >
                {flash.error}
            </p>
        );
    }

    return null;
}
