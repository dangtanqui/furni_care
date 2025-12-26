Rails.application.routes.draw do
  # Serve swagger.json directly (must be before mounted engines)
  get '/api-docs/v1/swagger.json', to: proc { |env|
    swagger_json_path = Rails.root.join('swagger', 'v1', 'swagger.json')
    if swagger_json_path.exist?
      [200, { 'Content-Type' => 'application/json' }, [File.read(swagger_json_path)]]
    else
      [404, { 'Content-Type' => 'text/plain' }, ['Not Found']]
    end
  }
  
  # Swagger documentation
  mount Rswag::Ui::Engine => '/api-docs'
  mount Rswag::Api::Engine => '/api-docs'
  
  # Sidekiq Web UI (protect with authentication in production)
  if Rails.env.production?
    require 'sidekiq/web'
    # TODO: Add authentication middleware before mounting Sidekiq::Web
    # Example: authenticate :user, ->(u) { u.admin? } do
    #   mount Sidekiq::Web => '/sidekiq'
    # end
    mount Sidekiq::Web => '/sidekiq'
  end
  
  namespace :api do
    get 'health', to: 'health#index'
    
    post 'auth/login', to: 'auth#login'
    post 'auth/register', to: 'auth#register'
    get 'auth/me', to: 'auth#me'
    
    resources :cases do
      member do
        post :advance_stage
        post :approve_cost
        post :reject_cost
        post :approve_final_cost
        post :reject_final_cost
        post :redo_case
        post :cancel_case
        post :attachments, to: 'case_attachments#create'
      end
      resources :case_attachments, only: [:destroy], controller: 'case_attachments', param: :id
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
