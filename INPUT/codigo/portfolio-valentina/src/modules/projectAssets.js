// Every image/video inside src/assets/projects/<folder>/ is picked up at build time.
// Vite resolves each match to its final (hashed) URL, so no paths have to be written by hand.
// Folder names start with the project id padded to 2 digits: "03-video-loop" -> project id 3.
const files = import.meta.glob('../assets/projects/*/*.{jpg,jpeg,png,webp,avif,gif,svg,mp4,webm}', {
  eager: true,
  import: 'default',
});

const VIDEO = /\.(mp4|webm)$/i;
const pad = (n) => String(n).padStart(2, '0');

// Returns { cover, gallery } for one project id.
// cover: URL of the file named "cover.*" (the 16:9 hero image) or null.
// gallery: the rest of the files, sorted by name (01.jpg, 02.jpg, ... 10.jpg).
export function getProjectAssets(id) {
  const entries = Object.entries(files)
    .map(([path, url]) => {
      const [folder, name] = path.split('/').slice(-2);
      return { folder, name, url, isVideo: VIDEO.test(name) };
    })
    .filter((file) => file.folder.split('-')[0] === pad(id))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  const cover = entries.find((file) => /^cover\./i.test(file.name));
  return {
    cover: cover?.url ?? null,
    gallery: entries.filter((file) => file !== cover),
  };
}
