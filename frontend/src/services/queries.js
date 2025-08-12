import { useQuery } from '@tanstack/react-query';
import apiClient from './sheetService';

// We reuse the axios instance from sheetService via its apiClient if exported; otherwise fall back to fetcher
// For this project, we'll call the existing endpoints through sheetService for now.

export function useAdminTeamResponses({ sheetId, teamKey, page = 1, pageSize = 25, filters = {} }) {
  return useQuery({
    queryKey: ['adminTeamResponses', { sheetId, teamKey, page, pageSize, filters }],
    queryFn: async () => {
      // Using sheetService.getAdminTeamSheetData which currently returns all responses.
      // For now we page on the client; backend can add ?page & ?pageSize later.
      const res = await (await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000/api'}/sheets/${sheetId}/team-data/${teamKey}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })).json();

      const items = (res.responses || []);
      const start = (page - 1) * pageSize;
      const paged = items.slice(start, start + pageSize);
      return { items: paged, total: items.length, sheet: res.sheet, assignment: res.assignment };
    },
    keepPreviousData: true,
    staleTime: 30_000
  });
}


