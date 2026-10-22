import type { FlashMessages } from '@/types/project';

type Props = {
    flash?: FlashMessages;
};

export function FlashMessage({ flash }: Props) {
    if (flash?.success) {
        return (
            <p
                role="status"
                className="border border-success-line bg-success-soft px-4 py-3 text-base text-success"
            >
                {flash.success}
            </p>
        );
    }

    if (flash?.error) {
        return (
            <p
                role="alert"
                className="border border-danger-line bg-danger-soft px-4 py-3 text-base text-danger"
            >
                {flash.error}
            </p>
        );
    }

    return null;
}
