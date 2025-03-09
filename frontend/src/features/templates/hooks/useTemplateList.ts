import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  selectTemplates,
  selectTemplatesLoading,
  selectTemplatesPagination,
  selectTemplatesFilter,
  setFilter,
  setCurrentPage,
  setPageSize,
  setSelectedTemplate,
} from '@/store/slices/templatesSlice';
import { fetchTemplates, deleteTemplate } from '@/store/thunks/templateThunks';
import { Template, TemplateFilter } from '../types';

export const useTemplateList = () => {
  const dispatch = useAppDispatch();
  const templates = useAppSelector(selectTemplates);
  const loading = useAppSelector(selectTemplatesLoading);
  const { pageSize, currentPage, total } = useAppSelector(selectTemplatesPagination);
  const filter = useAppSelector(selectTemplatesFilter);

  // Load templates on mount and when filters/pagination change
  useEffect(() => {
    dispatch(fetchTemplates({
      page: currentPage + 1,
      pageSize,
      filter,
    }));
  }, [dispatch, currentPage, pageSize, filter]);

  const handleFilterChange = (newFilter: TemplateFilter) => {
    dispatch(setFilter(newFilter));
  };

  const handleDeleteTemplate = async (template: Template) => {
    if (window.confirm(`Are you sure you want to delete template "${template.name}"?`)) {
      await dispatch(deleteTemplate(template.id));
      dispatch(fetchTemplates({
        page: currentPage + 1,
        pageSize,
        filter,
      }));
    }
  };

  const handlePageChange = (page: number) => {
    dispatch(setCurrentPage(page));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    dispatch(setPageSize(newPageSize));
  };

  const handleTemplateSelect = (template: Template) => {
    dispatch(setSelectedTemplate(template));
  };

  const reloadTemplates = () => {
    dispatch(fetchTemplates({
      page: currentPage + 1,
      pageSize,
      filter,
    }));
  };

  return {
    // State
    templates,
    loading,
    total,
    currentPage,
    pageSize,
    filter,

    // Actions
    onFilterChange: handleFilterChange,
    onDeleteTemplate: handleDeleteTemplate,
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
    onTemplateSelect: handleTemplateSelect,
    reloadTemplates,
  };
};

export default useTemplateList;
