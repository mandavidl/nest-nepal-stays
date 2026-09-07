import { useRef, useState } from "react";
import { ghostButtonClass } from "./Bits";
import {
  ACCEPTED_PHOTO_TYPES,
  MIN_PHOTOS,
  deletePropertyPhoto,
  isAcceptedPhoto,
  signPhotoPaths,
  uploadPropertyPhoto,
} from "@/lib/nest-photos";

export type PhotoState = { path: string; url: string };

/**
 * Real device uploads: photos are compressed, stored in the host's own folder and
 * kept as storage paths so they survive refreshes and sign-outs.
 */
export function PhotoUploader({
  userId,
  photos,
  cover,
  onChange,
  onCoverChange,
}: {
  userId: string;
  photos: PhotoState[];
  cover: string;
  onChange: (next: PhotoState[]) => void;
  onCoverChange: (path: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pick = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setError("");
    const chosen = Array.from(files);
    const rejected = chosen.filter((f) => !isAcceptedPhoto(f));
    const accepted = chosen.filter(isAcceptedPhoto);
    if (rejected.length) {
      setError(
        `${rejected.map((f) => f.name).join(", ")} — only JPG, JPEG, PNG and WEBP photos can be uploaded.`,
      );
    }
    if (!accepted.length) return;

    setBusy(true);
    try {
      const paths: string[] = [];
      for (const file of accepted) {
        if (file.size > 10 * 1024 * 1024) {
          setError(`${file.name} is larger than 10 MB. Please choose a smaller photo.`);
          continue;
        }
        paths.push(await uploadPropertyPhoto(file, userId));
      }
      const urls = await signPhotoPaths(paths);
      const added = paths.map((path) => ({ path, url: urls[path] ?? "" }));
      const next = [...photos, ...added];
      onChange(next);
      if (!cover && next[0]) onCoverChange(next[0].path);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed, please try again.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async (path: string) => {
    const next = photos.filter((p) => p.path !== path);
    onChange(next);
    if (cover === path) onCoverChange(next[0]?.path ?? "");
    await deletePropertyPhoto(path);
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= photos.length) return;
    const next = [...photos];
    const a = next[index];
    const b = next[target];
    if (!a || !b) return;
    next[index] = b;
    next[target] = a;
    onChange(next);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="field-label">
          Property photos <span className="text-brand">*</span>
        </span>
        <span className="text-[12px] text-stone2">
          {photos.length} uploaded · at least {MIN_PHOTOS} needed
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_PHOTO_TYPES.join(",")}
        onChange={(e) => void pick(e.target.files)}
        className="hidden"
      />

      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className={`${ghostButtonClass} mt-2 disabled:opacity-50`}
      >
        {busy ? "Uploading…" : "＋ Add Photos"}
      </button>
      <p className="mt-1.5 text-[12px] text-stone2">
        JPG, JPEG, PNG or WEBP. Large photos are optimised automatically. Tap a photo to make it the
        cover — the cover shows first everywhere.
      </p>
      {error && <p className="mt-2 text-[13px] font-semibold text-brand-deep">{error}</p>}

      {photos.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((p, i) => (
            <div
              key={p.path}
              className={`overflow-hidden rounded-2xl border-2 bg-cream ${
                cover === p.path ? "border-brand" : "border-sand"
              }`}
            >
              <button
                type="button"
                onClick={() => onCoverChange(p.path)}
                className="block w-full"
                aria-label={`Make photo ${i + 1} the cover photo`}
              >
                <img
                  src={p.url}
                  alt={`Property photo ${i + 1}`}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover"
                />
              </button>
              <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                <span className="text-[11px] font-semibold text-brand-deep">
                  {cover === p.path ? "Cover photo" : `Photo ${i + 1}`}
                </span>
                <span className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    aria-label="Move photo earlier"
                    className="rounded-lg bg-surface px-1.5 text-[12px] font-bold"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    aria-label="Move photo later"
                    className="rounded-lg bg-surface px-1.5 text-[12px] font-bold"
                  >
                    →
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(p.path)}
                    aria-label="Remove photo"
                    className="rounded-lg bg-surface px-1.5 text-[12px] font-bold text-brand"
                  >
                    ✕
                  </button>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
