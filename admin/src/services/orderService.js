import api from './api';

export const getAllOrders = async () => {
  const { data } = await api.get('/orders');
  return data;
};

// Return/refund status approve/reject করা
export const updateReturnStatus = async (orderId, returnStatus) => {
  const { data } = await api.put(`/orders/${orderId}/return-status`, { returnStatus });
  return data;
};