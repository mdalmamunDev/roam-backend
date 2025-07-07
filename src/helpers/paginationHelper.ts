import { PopulateOptions } from 'mongoose';

interface PaginationOptions {
  page: number | string;
  limit: number | string;
  filters: any;
  sortField?: string;
  sortOrder?: string;
  model: any;
  select?: string;
  populate?: PopulateOptions[]; // <--- directly expects array
}

const paginate = async ({
  page,
  limit,
  filters,
  sortField = 'createdAt',
  sortOrder = 'desc',
  model,
  select = '',
  populate,
}: PaginationOptions) => {
  const pageNumber = typeof page === 'string' ? parseInt(page) : page;
  const limitNumber = typeof limit === 'string' ? parseInt(limit) : limit;
  const skip = (pageNumber - 1) * limitNumber;

  let query = model
    .find(filters)
    .select(select)
    .sort({ [sortField]: sortOrder === 'desc' ? -1 : 1 })
    .skip(skip)
    .limit(limitNumber);

  // Apply populate if provided
  if (populate && populate.length > 0) {
    query = query.populate(populate);
  }

  const results = await query;
  const totalCount = await model.countDocuments(filters);

  return {
    results,
    pagination: {
      totalCount,
      totalPages: Math.ceil(totalCount / limitNumber),
      currentPage: pageNumber,
      itemsPerPage: limitNumber,
    },
  };
};

export default paginate;