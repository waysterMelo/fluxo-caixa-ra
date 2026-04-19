import api from './api';
import qs from 'qs';

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
  const response = await api.post<LoginResponse>('/login/access-token', 
    qs.stringify({
      username: email,
      password: senha,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );
  return response.data;
};

export const getMe = async (): Promise<User> => {
  const response = await api.get<User>('/users/me');
  return response.data;
};
