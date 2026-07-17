import { CreatorLibraryDashboard } from "@/components/creator-library-dashboard";
import { isClerkConfigured } from "@/lib/clerk-config";
import { getSelf } from "@/lib/auth-service";
import { getCreatorLibrary } from "@/lib/creator-film-service";

export default async function CreatorLibraryPage() {
  const self = isClerkConfigured ? await getSelf() : null;
  const films = self ? await getCreatorLibrary(self.id) : [];

  return (
    <CreatorLibraryDashboard
      persistChanges={Boolean(self)}
      initialFilms={films.map((film) => ({
        id: film.id,
        title: film.title,
        description: film.description,
        posterUrl: film.posterUrl,
        playbackUrl: film.playbackUrl,
        visibility: film.visibility,
        updatedAt: film.updatedAt.toISOString(),
      }))}
    />
  );
}
