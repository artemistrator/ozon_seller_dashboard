import { useSearchParams } from 'react-router-dom';
import { useMemo, useEffect } from 'react';
import { getDefaultDateRange, formatMoscowDate, toMoscowTime } from '../lib/date-utils';

export interface Filters {
  dateFrom: Date;
  dateTo: Date;
  sku: string;
  region: string;
  dateType: 'delivering_date' | 'shipment_date' | 'in_process_at';
}

export const useFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize URL with default date range if no parameters exist
  useEffect(() => {
    const hasDateParams = searchParams.has('from') || searchParams.has('to');
    if (!hasDateParams) {
      const defaultRange = getDefaultDateRange();
      const params = new URLSearchParams(searchParams);
      params.set('from', formatMoscowDate(defaultRange.from));
      params.set('to', formatMoscowDate(defaultRange.to));
      setSearchParams(params, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const filters = useMemo((): Filters => {
    const defaultRange = getDefaultDateRange();
    
    const dateFromParam = searchParams.get('from');
    const dateToParam = searchParams.get('to');
    const skuParam = searchParams.get('sku') || '';
    const regionParam = searchParams.get('region') || '';
    const dateTypeParam = searchParams.get('dateType') || 'shipment_date';

    let dateFrom = defaultRange.from;
    let dateTo = defaultRange.to;

    if (dateFromParam) {
      try {
        dateFrom = toMoscowTime(dateFromParam);
      } catch {
        // Invalid date, use default
      }
    }

    if (dateToParam) {
      try {
        dateTo = toMoscowTime(dateToParam);
      } catch {
        // Invalid date, use default
      }
    }

    return {
      dateFrom,
      dateTo,
      sku: skuParam,
      region: regionParam,
      dateType: (dateTypeParam === 'delivering_date' || dateTypeParam === 'shipment_date' || dateTypeParam === 'in_process_at') 
        ? dateTypeParam as 'delivering_date' | 'shipment_date' | 'in_process_at'
        : 'shipment_date',
    };
  }, [searchParams]);

  const updateFilters = (newFilters: Partial<Filters>) => {
    const params = new URLSearchParams(searchParams);

    if (newFilters.dateFrom !== undefined) {
      params.set('from', formatMoscowDate(newFilters.dateFrom));
    }

    if (newFilters.dateTo !== undefined) {
      params.set('to', formatMoscowDate(newFilters.dateTo));
    }

    if (newFilters.sku !== undefined) {
      if (newFilters.sku) {
        params.set('sku', newFilters.sku);
      } else {
        params.delete('sku');
      }
    }

    if (newFilters.region !== undefined) {
      if (newFilters.region) {
        params.set('region', newFilters.region);
      } else {
        params.delete('region');
      }
    }

    if (newFilters.dateType !== undefined) {
      params.set('dateType', newFilters.dateType);
    }

    setSearchParams(params);
  };

  const resetFilters = () => {
    const defaultRange = getDefaultDateRange();
    setSearchParams({
      from: formatMoscowDate(defaultRange.from),
      to: formatMoscowDate(defaultRange.to),
    });
  };

  return {
    filters,
    updateFilters,
    resetFilters,
  };
};