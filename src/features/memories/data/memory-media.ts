export type MemoryAspectRatio = "16/9" | "4/3" | "1/1" | "9/16" | "3/4";

export type MemoryImageItem = {
  id: string;
  type: "image";
  src: string;
  alt: string;
  caption?: string;
  dateLabel?: string;
  aspectRatio?: MemoryAspectRatio;
};

export type MemoryVideoSource = {
  src: string;
  type: "video/mp4" | "video/webm";
};

export type MemoryVideoTrack = {
  src: string;
  srcLang: string;
  label: string;
  default?: boolean;
};

export type MemoryVideoItem = {
  id: string;
  type: "video";
  title: string;
  description?: string;
  caption?: string;
  dateLabel?: string;
  poster?: string;
  aspectRatio?: MemoryAspectRatio;
  sources: MemoryVideoSource[];
  tracks?: MemoryVideoTrack[];
};

export type MemoryMediaItem = MemoryImageItem | MemoryVideoItem;

export const memoryMedia: MemoryMediaItem[] = [
  {
    id: "memory-photo-01",
    type: "image",
    src: "/media/ricordi/images/memory-01.jpg",
    alt: "Una fotografia dei nostri ricordi condivisi appoggiata sul tavolo di gioco.",
    caption: "Foto 1",
    aspectRatio: "3/4",
  },
  {
    id: "memory-photo-03",
    type: "image",
    src: "/media/ricordi/images/memory-03.png",
    alt: "Una terza immagine dei ricordi conservati nella galleria.",
    caption: "Foto 3",
    aspectRatio: "16/9",
  },
  {
    id: "memory-photo-04",
    type: "image",
    src: "/media/ricordi/images/memory-04.png",
    alt: "Una quarta immagine dei ricordi conservati nella galleria.",
    caption: "Foto 4",
    aspectRatio: "16/9",
  },
  {
    id: "memory-video-01",
    type: "video",
    title: "Video 1",
    aspectRatio: "16/9",
    sources: [
      {
        src: "/media/ricordi/videos/memory-video-01.mp4",
        type: "video/mp4",
      },
    ],
  },
  {
    id: "memory-video-02",
    type: "video",
    title: "Video 2",
    aspectRatio: "16/9",
    sources: [
      {
        src: "/media/ricordi/videos/memory-video-02.mp4",
        type: "video/mp4",
      },
    ],
  },
];
