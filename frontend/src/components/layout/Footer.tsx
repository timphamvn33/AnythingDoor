'use client';

export default function Footer() {
  return (
    <footer className="bg-gray-200 text-gray-700 border-t mt-10">
      <div className="container mx-auto px-4 py-8 flex flex-col items-center">
        {/* Centered Logo */}
        <div className="text-2xl font-bold mb-6">AnythingDoor</div>

        {/* Footer Links Grid */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 text-sm text-center md:text-left">
          <div>
            <h4 className="font-semibold mb-2">Product</h4>
            <ul className="space-y-1">
              <li>
                <a href="#" className="hover:underline">
                  Overview
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline">
                  Marketplace
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Support</h4>
            <ul className="space-y-1">
              <li>
                <a href="#" className="hover:underline">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline">
                  API Status
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Features</h4>
            <ul className="space-y-1">
              <li>
                <a href="#" className="hover:underline">
                  Realtime
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline">
                  Collaboration
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline">
                  Security
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Years</h4>
            <ul className="space-y-1">
              <li>
                <a href="#" className="hover:underline">
                  2023
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline">
                  2024
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline">
                  2025
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Legal</h4>
            <ul className="space-y-1">
              <li>
                <a href="#" className="hover:underline">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="mt-8 text-xs text-gray-500 text-center w-full border-t pt-4">
          © 2025 Made by Tim
        </div>
      </div>
    </footer>
  );
}
