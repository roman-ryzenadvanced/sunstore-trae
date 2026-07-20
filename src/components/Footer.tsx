"use client"

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-700/50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold mb-4">
              <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">ROMMARK</span>
              <span className="text-white">.DEV</span>
            </h3>
            <p className="text-slate-400 mb-6 max-w-md">
              Инженерная энергетика нового поколения. Умные системы и квантовые технологии фотоники для максимальной эффективности.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-orange-400 transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-2.719 0-4.92 2.201-4.92 4.917 0 .387.044.763.127 1.124-4.084-.205-7.719-2.165-10.148-5.146-1.297 2.214-.669 5.085 1.523 6.574.798-.133 1.55-.468 2.85-.909 3.406-1.604.183-3.237-.479-4.242-1.466L7 9.583l-7.279 7.279c-.189-.474-.279-.986-.279-1.515 0-2.066 1.602-3.988 3.558-4.387-.233-.067-.48-.103-.736-.103-.177 0-.348.018-.517.027 2.375-2.315 5.098-3.68 8.028-3.68 6.068 0 9.434 3.932 9.434 9.436 0 .716-.051 1.424-.15 2.124 7.96-4.575 13.553-11.688 13.553-19.63 0-.3-.013-.597-.036-.894-1.935 1.629-4.187 2.916-6.604 3.792-1.237.837-2.24 1.35-3.672 1.35-4.852 0-8.788-3.937-8.788-8.788 0-.176.019-.351.052-.522 2.578-2.191 4.755-5.098 6.188-8.246z"/>
                </svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-orange-400 transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.197H9.213V9.757H15.82v2.544H15.82c.037.945.061 2.058.061 3.377 0 2.286-.148 4.035-.909 5.258H20.34z"/>
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Продукция</h4>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="/array?category=elite" className="hover:text-orange-400 transition-colors">Элитные системы</Link></li>
              <li><Link href="/array?category=professional" className="hover:text-orange-400 transition-colors">Профессиональные системы</Link></li>
              <li><Link href="/array?category=standard" className="hover:text-orange-400 transition-colors">Стандартные системы</Link></li>
              <li><Link href="/blueprint" className="hover:text-orange-400 transition-colors">Конфигуратор</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Компания</h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#" className="hover:text-orange-400 transition-colors">О нас</a></li>
              <li><a href="#" className="hover:text-orange-400 transition-colors">Технологии</a></li>
              <li><a href="#" className="hover:text-orange-400 transition-colors">Доставка</a></li>
              <li><a href="#" className="hover:text-orange-400 transition-colors">Контакты</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-700/50 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className="text-slate-400 text-sm mb-4 md:mb-0">
              © 2024 ROMMARK.DEV. Все права защищены.
            </p>
            <div className="flex items-center space-x-6 text-sm text-slate-400">
              <a href="#" className="hover:text-orange-400 transition-colors">Политика конфиденциальности</a>
              <a href="#" className="hover:text-orange-400 transition-colors">Условия использования</a>
              <a href="#" className="hover:text-orange-400 transition-colors">Карта сайта</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}