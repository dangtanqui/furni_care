Rails.application.routes.draw do
  namespace :api do
    post 'auth/login', to: 'auth#login'
    post 'auth/register', to: 'auth#register'
    get 'auth/me', to: 'auth#me'
    
    resources :cases do
      member do
        post :advance_stage
        post :approve_cost
        post :reject_cost
        post :redo_case
        post :attachments, to: 'case_attachments#create'
      end
    end
    
    resources :clients, only: [:index] do
      member do
        get :sites
      end
    end
    
    resources :sites, only: [] do
      member do
        get :contacts
      end
    end
    
    get 'users/technicians', to: 'users#technicians'
  end
end
