require 'rails_helper'

RSpec.describe AuthService, type: :service do
  describe '#login' do
    let!(:user) { create(:user, email: 'test@example.com', password: 'password123') }
    let(:jwt_secret) { 'test_secret' }
    let(:service) { AuthService.new }

    context 'with valid credentials' do
      it 'returns success with token and user' do
        # Reload user to ensure password is hashed
        user.reload
        
        result = service.login(
          email: 'test@example.com',
          password: 'password123',
          jwt_secret: jwt_secret,
          expires_in: 30.days
        )

        expect(result).to be_success
        expect(result.data[:token]).to be_present
        expect(result.data[:user][:id]).to eq(user.id)
        expect(result.data[:user][:email]).to eq(user.email)
      end

      it 'includes expiration in JWT token' do
        result = service.login(
          email: 'test@example.com',
          password: 'password123',
          jwt_secret: jwt_secret,
          expires_in: 1.day
        )

        decoded = JWT.decode(result.data[:token], jwt_secret, true, { algorithm: 'HS256' })
        expect(decoded[0]['exp']).to be_present
        expect(decoded[0]['user_id']).to eq(user.id)
      end
    end

    context 'with invalid credentials' do
      it 'returns failure with error message' do
        result = service.login(
          email: 'test@example.com',
          password: 'wrong_password',
          jwt_secret: jwt_secret
        )

        expect(result).to be_failure
        expect(result.errors).to include('Invalid email or password')
        expect(result.status).to eq(:unauthorized)
      end

      it 'returns failure for non-existent user' do
        result = service.login(
          email: 'nonexistent@example.com',
          password: 'password123',
          jwt_secret: jwt_secret
        )

        expect(result).to be_failure
        expect(result.errors).to include('Invalid email or password')
      end
    end
  end

  describe '#register' do
    let(:jwt_secret) { 'test_secret' }
    let(:service) { AuthService.new }
    let(:user_params) do
      {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        role: 'cs'
      }
    end

    context 'with valid params' do
      it 'creates user and returns success with token' do
        result = service.register(user_params: user_params, jwt_secret: jwt_secret)

        expect(result).to be_success
        expect(result.data[:token]).to be_present
        expect(result.data[:user][:email]).to eq('newuser@example.com')
        expect(User.find_by(email: 'newuser@example.com')).to be_present
      end
    end

    context 'with invalid params' do
      it 'returns failure with validation errors' do
        invalid_params = user_params.merge(email: '')
        result = service.register(user_params: invalid_params, jwt_secret: jwt_secret)

        expect(result).to be_failure
        expect(result.errors).to be_present
      end

      it 'returns failure for duplicate email' do
        create(:user, email: 'duplicate@example.com')
        duplicate_params = user_params.merge(email: 'duplicate@example.com')
        result = service.register(user_params: duplicate_params, jwt_secret: jwt_secret)

        expect(result).to be_failure
      end
    end
  end

  describe '#current_user_data' do
    let(:user) { create(:user) }
    let(:service) { AuthService.new(current_user: user) }

    it 'returns current user data' do
      result = service.current_user_data

      expect(result).to be_success
      expect(result.data[:user][:id]).to eq(user.id)
      expect(result.data[:user][:email]).to eq(user.email)
      expect(result.data[:user][:name]).to eq(user.name)
      expect(result.data[:user][:role]).to eq(user.role)
    end
  end
end

