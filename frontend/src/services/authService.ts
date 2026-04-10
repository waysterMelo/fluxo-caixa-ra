import api from './api';

export interface User {
  id: number;
  email: string;
  nome: string;
  is_admin: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export const login = async (email: string, senha: string): Promise<LoginResponse> => {
  const formData = new FormData();
  formData.append('username', email);
  formData.append('password', senha);

  const response = await api.post<LoginResponse>('/login/access-token', formData);
  return response.data;
};

export const getMe = async (): Promise<User> => {
  const response = await api.get<User>('/users/me');
  return response.data;
};
