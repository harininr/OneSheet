import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CheatSheetResponse } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

// GET /api/cheatsheets
export function useCheatSheets() {
  return useQuery({
    queryKey: [api.cheatSheets.list.path],
    queryFn: async () => {
      const res = await fetch(api.cheatSheets.list.path);
      if (!res.ok) throw new Error("Failed to fetch cheat sheets");
      return api.cheatSheets.list.responses[200].parse(await res.json());
    },
  });
}

// GET /api/cheatsheets/:id
export function useCheatSheet(id: number) {
  return useQuery({
    queryKey: [api.cheatSheets.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.cheatSheets.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch cheat sheet");
      return api.cheatSheets.get.responses[200].parse(await res.json());
    },
    // Poll every 2 seconds if processing (no extracted content yet)
    refetchInterval: (data) => {
      if (!data) return false;
      // If we have content, stop polling. If not, keep checking.
      return !data.structuredContent ? 2000 : false;
    },
  });
}

// POST /api/upload
export function useUploadCheatSheet() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(api.cheatSheets.upload.path, {
        method: api.cheatSheets.upload.method,
        body: formData,
      });

      if (!res.ok) {
        if (res.status === 400) {
          throw new Error("Invalid file format. Please upload an image.");
        }
        throw new Error("Upload failed");
      }
      
      return api.cheatSheets.upload.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.cheatSheets.list.path] });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

// POST /api/cheatsheets/:id/process
export function useProcessCheatSheet() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.cheatSheets.process.path, { id });
      const res = await fetch(url, {
        method: api.cheatSheets.process.method,
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        if (res.status === 404) throw new Error("Cheat sheet not found");
        throw new Error("Processing failed");
      }

      return api.cheatSheets.process.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.cheatSheets.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.cheatSheets.get.path, data.id] });
      toast({
        title: "Processing Started",
        description: "Your cheat sheet is being generated. This may take a moment.",
      });
    },
    onError: (error) => {
      toast({
        title: "Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}
