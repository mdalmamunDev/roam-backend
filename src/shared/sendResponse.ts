import { Response } from 'express';

type IData<T> = {
  code: number;
  message?: string;
  data?: T;
  pagination?: {
    totalCount?: number;
    totalPages?: number;
    currentPage?: number;
    itemsPerPage?: number;
  };
};

const sendResponse = <T>(res: Response, data: IData<T>) => {
  const resData = {
    code: data.code,
    message: data.message,
    data: data.data,
    pagination: data.pagination,
  };
  res.status(data.code).json(resData);
};

export default sendResponse;
