class SessionsController < ApplicationController
  skip_before_filter :require_login
  skip_after_filter :extend_expiration, :only => :destroy

  def create
    user = CredentialsValidator.user(params[:username], params[:password])
    session[:user_id] = user.id
    present user, :status => :created
  rescue CredentialsValidator::Invalid => e
    present_validation_errors e.record.errors, :status => :unauthorized
  end

  def destroy
    session.clear
    head :no_content
  end
end
