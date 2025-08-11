export const createPageUrl = (pageName: string): string => {
  const routes: Record<string, string> = {
    'Gallery': '/gallery',
    'Upload': '/upload',
    'Home': '/'
  };
  
  return `${routes[pageName] || '/'}`;
}; 