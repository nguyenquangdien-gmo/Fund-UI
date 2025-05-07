export interface DriveFile {
  id: number;
  name: string;
  type: string;
  size: number;
  lastModified: string;
  googleId: string;
  path: string;
}

export interface DriveFolder {
  id: number;
  name: string;
  googleId: string;
  path: string;
  children: DriveFolder[];
}

export interface DriveBookmark {
  id: number;
  name: string;
  type: 'file' | 'folder';
  googleId: string;
  path: string;
  category: string;
}

export interface FolderContents {
  files: DriveFile[];
  folders: DriveFolder[];
} 