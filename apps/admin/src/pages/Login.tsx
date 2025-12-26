const Login = () => {
  const handleGoogleLogin = () => {
    // This will be implemented with real Google OAuth later
    console.log('Google Login Clicked');
  };

  return (
    <div className="min-h-screen bg-bg-secondary flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-border p-8 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary">상담예약 시스템</h1>
          <p className="text-text-secondary">관리자 페이지에 로그인하세요</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-border rounded-xl font-semibold text-text-primary hover:bg-bg-secondary hover:border-border-dark transition-all duration-200 shadow-sm"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            <span>Google 계정으로 로그인</span>
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-text-tertiary">Authorized Access Only</span>
          </div>
        </div>

        <p className="text-center text-xs text-text-tertiary">
          Copyright &copy; 2025 Consultation Booking. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
