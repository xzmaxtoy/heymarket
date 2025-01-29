import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  Template, 
  TemplateFilter, 
  TemplateStats,
  TemplateCategory,
  DEFAULT_TEMPLATE_SORT 
} from '@/features/templates/types';

interface TemplatesState {
  templates: Template[];
  selectedTemplate: Template | null;
  loading: boolean;
  error: string | null;
  total: number;
  pageSize: number;
  currentPage: number;
  filter: TemplateFilter;
  stats: Record<string, TemplateStats>;
  categories: TemplateCategory[];
  previewMode: boolean;
  previewVariables: Record<string, string>;
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
    sortBy: DEFAULT_TEMPLATE_SORT.sortBy,
    sortOrder: DEFAULT_TEMPLATE_SORT.sortOrder,
  },
  stats: {},
  categories: [],
  previewMode: false,
  previewVariables: {},
};

const templatesSlice = createSlice({
  name: 'templates',
  initialState,
  reducers: {
    setTemplates: (state, action: PayloadAction<Template[]>) => {
      state.templates = action.payload;
    },
    setSelectedTemplate: (state, action: PayloadAction<Template | null>) => {
      state.selectedTemplate = action.payload;
      if (action.payload) {
        state.previewVariables = action.payload.variables.reduce((acc, variable) => ({
          ...acc,
          [variable]: ''
        }), {});
      } else {
        state.previewVariables = {};
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setTotal: (state, action: PayloadAction<number>) => {
      state.total = action.payload;
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload;
      state.currentPage = 0; // Reset to first page when changing page size
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    setFilter: (state, action: PayloadAction<TemplateFilter>) => {
      state.filter = action.payload;
      state.currentPage = 0; // Reset to first page when changing filters
    },
    setStats: (state, action: PayloadAction<Record<string, TemplateStats>>) => {
      state.stats = action.payload;
    },
    updateTemplateStats: (state, action: PayloadAction<TemplateStats>) => {
      state.stats[action.payload.id] = action.payload;
    },
    setCategories: (state, action: PayloadAction<TemplateCategory[]>) => {
      state.categories = action.payload;
    },
    addCategory: (state, action: PayloadAction<TemplateCategory>) => {
      state.categories.push(action.payload);
    },
    removeCategory: (state, action: PayloadAction<string>) => {
      state.categories = state.categories.filter(cat => cat.id !== action.payload);
    },
    updateCategory: (state, action: PayloadAction<TemplateCategory>) => {
      const index = state.categories.findIndex(cat => cat.id === action.payload.id);
      if (index !== -1) {
        state.categories[index] = action.payload;
      }
    },
    setPreviewMode: (state, action: PayloadAction<boolean>) => {
      state.previewMode = action.payload;
    },
    setPreviewVariables: (state, action: PayloadAction<Record<string, string>>) => {
      state.previewVariables = action.payload;
    },
    updatePreviewVariable: (state, action: PayloadAction<{ name: string; value: string }>) => {
      state.previewVariables[action.payload.name] = action.payload.value;
    },
    resetState: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const {
  setTemplates,
  setSelectedTemplate,
  setLoading,
  setError,
  setTotal,
  setPageSize,
  setCurrentPage,
  setFilter,
  setStats,
  updateTemplateStats,
  setCategories,
  addCategory,
  removeCategory,
  updateCategory,
  setPreviewMode,
  setPreviewVariables,
  updatePreviewVariable,
  resetState,
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

export const selectTemplateStats = (state: { templates: TemplatesState }) => 
  state.templates.stats;

export const selectTemplateCategories = (state: { templates: TemplatesState }) => 
  state.templates.categories;

export const selectPreviewMode = (state: { templates: TemplatesState }) => 
  state.templates.previewMode;

export const selectPreviewVariables = (state: { templates: TemplatesState }) => 
  state.templates.previewVariables;

export default templatesSlice.reducer;