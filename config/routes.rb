Chorus::Application.routes.draw do
  resource :sessions, :only => [ :create, :destroy, :show ]
  resources :users, :only => [ :index, :show, :create, :update, :destroy ] do
    collection do
      get :ldap
    end
  end

  resources :instances, :only => [:index, :create, :update]
  match "/" => "root#index"

  match '*not_found' => 'root#not_found'
end
