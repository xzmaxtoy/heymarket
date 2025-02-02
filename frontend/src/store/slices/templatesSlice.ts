import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Template, TemplateFilter } from '@/features/templates/types';
import { fetchTemplates, createTemplate, updateTemplate, deleteTemplate } from '../thunks/templateThunks';

interface TemplatesState {
  templates: Template[];
  selectedTemplate: Template | null;
  loading: boolean;
  error: string | null;
  total: number;
  pageSize: number;
  currentPage: number;
  filter: TemplateFilter;
}

const initialState: TemplatesState = {
  templates: [],
  selectedTemplate: null,
  loading: false,
  error: null,
  total: 0,
  pageSize: 10,
  currentPage: 0,
  filter: {
    sortBy: 'updated_at',
    sortOrder: 'desc',
  },
};

const templatesSlice = createSlice({
  name: 'templates',
  initialState,
  reducers: {
    setSelectedTemplate: (state, action: PayloadAction<Template | null>) => {
      state.selectedTemplate = action.payload;
    },
    setFilter: (state, action: PayloadAction<TemplateFilter>) => {
      state.filter = action.payload;
      state.currentPage = 0; // Reset to first page when changing filters
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload;
      state.currentPage = 0; // Reset to first page when changing page size
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Handle fetchTemplates
    builder
      .addCase(fetchTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        console.log('fetchTemplates.fulfilled:', action.payload);
        state.loading = false;
        state.templates = action.payload.templates;
        state.total = action.payload.total;
      })
      .addCase(fetchTemplates.rejected, (state, action) => {
        console.error('fetchTemplates.rejected:', action.error);
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch templates';
      })

    // Handle createTemplate
    builder
      .addCase(createTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTemplate.fulfilled, (state, action) => {
        console.log('createTemplate.fulfilled:', action.payload);
        state.loading = false;
        // Don't update the list here - let the component trigger a refresh
      })
      .addCase(createTemplate.rejected, (state, action) => {
        console.error('createTemplate.rejected:', action.error);
        state.loading = false;
        state.error = action.error.message || 'Failed to create template';
      })

    // Handle updateTemplate
    builder
      .addCase(updateTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTemplate.fulfilled, (state, action) => {
        console.log('updateTemplate.fulfilled:', action.payload);
        state.loading = false;
        // Update the template in the list
        const index = state.templates.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.templates[index] = action.payload;
        }
        // Update selected template if it's the one being edited
        if (state.selectedTemplate?.id === action.payload.id) {
          state.selectedTemplate = action.payload;
        }
      })
      .addCase(updateTemplate.rejected, (state, action) => {
        console.error('updateTemplate.rejected:', action.error);
        state.loading = false;
        state.error = action.error.message || 'Failed to update template';
      })

    // Handle deleteTemplate
    builder
      .addCase(deleteTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTemplate.fulfilled, (state, action) => {
        console.log('deleteTemplate.fulfilled:', action.payload);
        state.loading = false;
        // Don't update the list here - let the component trigger a refresh
      })
      .addCase(deleteTemplate.rejected, (state, action) => {
        console.error('deleteTemplate.rejected:', action.error);
        state.loading = false;
        state.error = action.error.message || 'Failed to delete template';
      });
  },
});

export const {
  setSelectedTemplate,
  setFilter,
  setPageSize,
  setCurrentPage,
} = templatesSlice.actions;

// Selectors
export const selectTemplates = (state: { templates: TemplatesState }) => 
  state.templates.templates;

export const selectSelectedTemplate = (state: { templates: TemplatesState }) => 
  state.templates.selectedTemplate;

export const selectTemplatesLoading = (state: { templates: TemplatesState }) => 
  state.templates.loading;

export const selectTemplatesError = (state: { templates: TemplatesState }) => 
  state.templates.error;

export const selectTemplatesPagination = (state: { templates: TemplatesState }) => ({
  pageSize: state.templates.pageSize,
  currentPage: state.templates.currentPage,
  total: state.templates.total,
});

export const selectTemplatesFilter = (state: { templates: TemplatesState }) => 
  state.templates.filter;

export default templatesSlice.reducer;
