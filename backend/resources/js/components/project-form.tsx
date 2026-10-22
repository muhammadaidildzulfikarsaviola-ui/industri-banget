import { useForm } from '@inertiajs/react';
import type { Project, ProjectStatus } from '@/types/project';

type ProjectFields = {
    name: string;
    industry: string;
    description: string;
    status: ProjectStatus;
};

type Props = {
    project?: Project;
};

export function ProjectForm({ project }: Props) {
    const { data, setData, post, put, processing, errors, reset } =
        useForm<ProjectFields>({
            name: project?.name ?? '',
            industry: project?.industry ?? '',
            description: project?.description ?? '',
            status: project?.status ?? 'active',
        });

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (project) {
            put(`/projects/${project.id}`);
            return;
        }

        post('/projects', { onSuccess: () => reset() });
    }

    return (
        <form onSubmit={submit} className="space-y-4">
            <div>
                <label htmlFor="name" className="mb-2 block text-sm">
                    Nama proyek{' '}
                    <span aria-hidden="true" className="text-[#e8f06b]">
                        *
                    </span>
                </label>
                <input
                    id="name"
                    value={data.name}
                    onChange={(event) => setData('name', event.target.value)}
                    maxLength={255}
                    required
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                    className="min-h-11 w-full border border-[#45463e] bg-[#111210] px-3 text-sm outline-none placeholder:text-[#77786f] focus-visible:border-[#e8f06b] focus-visible:ring-1 focus-visible:ring-[#e8f06b]"
                    placeholder="Contoh: Optimasi persediaan"
                />
                {errors.name && (
                    <p
                        id="name-error"
                        role="alert"
                        className="mt-1 text-sm text-red-300"
                    >
                        {errors.name}
                    </p>
                )}
            </div>
            <div>
                <label htmlFor="industry" className="mb-2 block text-sm">
                    Bidang industri
                </label>
                <input
                    id="industry"
                    value={data.industry}
                    onChange={(event) =>
                        setData('industry', event.target.value)
                    }
                    maxLength={255}
                    aria-invalid={Boolean(errors.industry)}
                    aria-describedby={
                        errors.industry ? 'industry-error' : undefined
                    }
                    className="min-h-11 w-full border border-[#45463e] bg-[#111210] px-3 text-sm outline-none placeholder:text-[#77786f] focus-visible:border-[#e8f06b] focus-visible:ring-1 focus-visible:ring-[#e8f06b]"
                    placeholder="Manufaktur, logistik, ..."
                />
                {errors.industry && (
                    <p
                        id="industry-error"
                        role="alert"
                        className="mt-1 text-sm text-red-300"
                    >
                        {errors.industry}
                    </p>
                )}
            </div>
            <div>
                <label htmlFor="description" className="mb-2 block text-sm">
                    Deskripsi
                </label>
                <textarea
                    id="description"
                    value={data.description}
                    onChange={(event) =>
                        setData('description', event.target.value)
                    }
                    aria-invalid={Boolean(errors.description)}
                    aria-describedby={
                        errors.description ? 'description-error' : undefined
                    }
                    className="min-h-28 w-full resize-y border border-[#45463e] bg-[#111210] px-3 py-2 text-sm outline-none placeholder:text-[#77786f] focus-visible:border-[#e8f06b] focus-visible:ring-1 focus-visible:ring-[#e8f06b]"
                    placeholder="Tujuan dan ruang lingkup proyek"
                />
                {errors.description && (
                    <p
                        id="description-error"
                        role="alert"
                        className="mt-1 text-sm text-red-300"
                    >
                        {errors.description}
                    </p>
                )}
            </div>
            <div>
                <label htmlFor="status" className="mb-2 block text-sm">
                    Status
                </label>
                <select
                    id="status"
                    value={data.status}
                    onChange={(event) =>
                        setData('status', event.target.value as ProjectStatus)
                    }
                    aria-invalid={Boolean(errors.status)}
                    aria-describedby={
                        errors.status ? 'status-error' : undefined
                    }
                    className="min-h-11 w-full border border-[#45463e] bg-[#111210] px-3 text-sm outline-none focus-visible:border-[#e8f06b] focus-visible:ring-1 focus-visible:ring-[#e8f06b]"
                >
                    <option value="active">Aktif</option>
                    <option value="completed">Selesai</option>
                    <option value="on_hold">Ditunda</option>
                </select>
                {errors.status && (
                    <p
                        id="status-error"
                        role="alert"
                        className="mt-1 text-sm text-red-300"
                    >
                        {errors.status}
                    </p>
                )}
            </div>
            <button
                type="submit"
                disabled={processing}
                className="min-h-11 w-full bg-[#e8f06b] px-4 text-sm font-semibold text-[#171815] transition-colors hover:bg-[#f2f6a0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8f06b] disabled:cursor-wait disabled:opacity-60"
            >
                {processing
                    ? 'Menyimpan proyek…'
                    : project
                      ? 'Simpan perubahan →'
                      : 'Simpan proyek →'}
            </button>
        </form>
    );
}
