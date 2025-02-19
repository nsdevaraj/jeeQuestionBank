export interface Welcome {
  title: string;
  description: string;
}

export interface Feature {
  id: number;
  title: string;
  description: string;
}

export interface ContentData {
  welcome: Welcome;
  features: Feature[];
}