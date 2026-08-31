import JSZip from "jszip";
import { db } from "./db";

export async function exportWorkspace(): Promise<void> {
  const zip = new JSZip();

  // Export Documents
  const documents = await db.documents.toArray();
  zip.file("documents.json", JSON.stringify(documents, null, 2));

  // Export Versions
  const versions = await db.versions.toArray();
  zip.file("versions.json", JSON.stringify(versions, null, 2));

  // Export Settings
  const settings = await db.settings.toArray();
  zip.file("settings.json", JSON.stringify(settings, null, 2));

  // Export Images
  const images = await db.images.toArray();
  const imagesFolder = zip.folder("images");
  if (imagesFolder) {
    const imageData = await Promise.all(
      images.map(async (img) => {
        const arrayBuffer = await img.blob.arrayBuffer();
        imagesFolder.file(`${img.id}-${img.name}`, arrayBuffer);
        return {
          id: img.id,
          name: img.name,
          type: img.type,
          createdAt: img.createdAt,
          blobPath: `${img.id}-${img.name}`,
        };
      })
    );
    zip.file("images_meta.json", JSON.stringify(imageData, null, 2));
  }

  // Generate and download ZIP
  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = url;
  a.download = `writenex-backup-${new Date().toISOString().split("T")[0]}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importWorkspace(file: File): Promise<void> {
  const zip = await JSZip.loadAsync(file);

  // Restore Documents
  const docsFile = zip.file("documents.json");
  if (docsFile) {
    const docsText = await docsFile.async("string");
    const documents = JSON.parse(docsText);
    await db.documents.clear();
    await db.documents.bulkAdd(documents);
  }

  // Restore Versions
  const versionsFile = zip.file("versions.json");
  if (versionsFile) {
    const versionsText = await versionsFile.async("string");
    const versions = JSON.parse(versionsText);
    await db.versions.clear();
    await db.versions.bulkAdd(versions);
  }

  // Restore Settings
  const settingsFile = zip.file("settings.json");
  if (settingsFile) {
    const settingsText = await settingsFile.async("string");
    const settings = JSON.parse(settingsText);
    await db.settings.clear();
    await db.settings.bulkAdd(settings);
  }

  // Restore Images
  const imagesMetaFile = zip.file("images_meta.json");
  if (imagesMetaFile) {
    const imagesMetaText = await imagesMetaFile.async("string");
    const imagesMeta = JSON.parse(imagesMetaText);
    await db.images.clear();

    const imagesToRestore = [];
    for (const meta of imagesMeta) {
      const imgFile = zip.file(`images/${meta.blobPath}`);
      if (imgFile) {
        const arrayBuffer = await imgFile.async("arraybuffer");
        const blob = new Blob([arrayBuffer], { type: meta.type });
        imagesToRestore.push({
          id: meta.id,
          name: meta.name,
          type: meta.type,
          createdAt: new Date(meta.createdAt),
          blob,
        });
      }
    }
    if (imagesToRestore.length > 0) {
      await db.images.bulkAdd(imagesToRestore);
    }
  }
}
