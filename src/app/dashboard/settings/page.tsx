"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AppConfig } from "@/types";
import {
  Settings,
  Globe,
  Bell,
  Shield,
  Database,
  AlertTriangle,
  Save,
  Plus,
  Trash2,
  Smartphone,
} from "lucide-react";
import toast from "react-hot-toast";

const defaultConfig: AppConfig = {
  maintenanceMode: false,
  contactHotline: "1800 8888",
  supportedCities: ["Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Cần Thơ", "Hải Phòng", "Huế"],
  minAppVersion: "1.1.5",
};

export default function SettingsPage() {
  const [config, setConfig] = useState<AppConfig>(defaultConfig);
  const [newCity, setNewCity] = useState("");

  const handleAddCity = () => {
    if (!newCity.trim()) return;
    setConfig(c => ({ ...c, supportedCities: [...c.supportedCities, newCity.trim()] }));
    setNewCity("");
  };

  const handleRemoveCity = (city: string) => {
    setConfig(c => ({ ...c, supportedCities: c.supportedCities.filter(x => x !== city) }));
  };

  const handleSave = () => {
    toast.success("Đã lưu cấu hình hệ thống");
  };

  return (
    <div className="page-transition">
      <Header title="Cài đặt hệ thống" subtitle="Cấu hình toàn cục cho nền tảng Tripzio" />

      <div className="p-6">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-lg">
            <TabsTrigger value="general" className="gap-2">
              <Globe className="h-3.5 w-3.5" />
              Chung
            </TabsTrigger>
            <TabsTrigger value="app" className="gap-2">
              <Smartphone className="h-3.5 w-3.5" />
              Ứng dụng
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-3.5 w-3.5" />
              Thông báo
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-3.5 w-3.5" />
              Bảo mật
            </TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6">
            {/* Maintenance mode */}
            <div className="rounded-xl border bg-card p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Chế độ bảo trì</h3>
                  <p className="text-xs text-muted-foreground">Khi bật, toàn bộ ứng dụng client sẽ hiển thị màn hình bảo trì</p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/50 p-4">
                <div>
                  <p className="text-sm font-medium">
                    {config.maintenanceMode ? "⚠️ Đang bật chế độ bảo trì" : "✅ Hệ thống hoạt động bình thường"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {config.maintenanceMode
                      ? "Tất cả khách hàng đang không thể sử dụng ứng dụng"
                      : "Tất cả dịch vụ hoạt động bình thường"}
                  </p>
                </div>
                <Switch
                  checked={config.maintenanceMode}
                  onCheckedChange={(v) => {
                    setConfig(c => ({ ...c, maintenanceMode: v }));
                    toast(v ? "⚠️ Đã bật chế độ bảo trì" : "✅ Đã tắt chế độ bảo trì", { icon: v ? "⚠️" : "✅" });
                  }}
                />
              </div>
            </div>

            {/* Contact */}
            <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
                  <Globe className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Thông tin liên hệ</h3>
                  <p className="text-xs text-muted-foreground">Hotline hỗ trợ hiển thị trong ứng dụng</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Hotline hỗ trợ</Label>
                <Input
                  value={config.contactHotline}
                  onChange={(e) => setConfig(c => ({ ...c, contactHotline: e.target.value }))}
                  placeholder="1800 8888"
                  className="max-w-sm"
                />
              </div>
            </div>

            {/* Supported cities */}
            <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-100">
                  <Database className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Thành phố khởi hành</h3>
                  <p className="text-xs text-muted-foreground">Danh sách thành phố cho phép chọn điểm đi</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {config.supportedCities.map((city) => (
                  <span
                    key={city}
                    className="flex items-center gap-1 rounded-full border bg-muted px-3 py-1 text-sm"
                  >
                    {city}
                    <button
                      onClick={() => handleRemoveCity(city)}
                      className="ml-1 text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 max-w-sm">
                <Input
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="Thêm thành phố mới..."
                  onKeyDown={(e) => e.key === "Enter" && handleAddCity()}
                />
                <Button variant="outline" size="icon" onClick={handleAddCity}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700" onClick={handleSave}>
              <Save className="h-4 w-4" />
              Lưu cài đặt
            </Button>
          </TabsContent>

          {/* App Tab */}
          <TabsContent value="app" className="space-y-6">
            <div className="rounded-xl border bg-card p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100">
                  <Smartphone className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Phiên bản ứng dụng</h3>
                  <p className="text-xs text-muted-foreground">Phiên bản tối thiểu bắt buộc người dùng cập nhật</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 max-w-sm">
                <div className="space-y-2">
                  <Label>Phiên bản tối thiểu</Label>
                  <Input
                    value={config.minAppVersion}
                    onChange={(e) => setConfig(c => ({ ...c, minAppVersion: e.target.value }))}
                    placeholder="1.1.5"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                {[
                  { label: "Hiển thị banner khuyến mãi", desc: "Banner popup khi mở ứng dụng", defaultChecked: true },
                  { label: "Cho phép đánh giá tour", desc: "Người dùng có thể viết review sau khi hoàn thành tour", defaultChecked: true },
                  { label: "Thông báo đơn hàng", desc: "Gửi push notification khi có cập nhật đơn hàng", defaultChecked: true },
                  { label: "Flash Sale tự động", desc: "Tự động hiển thị countdown timer cho tour flash sale", defaultChecked: false },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch defaultChecked={item.defaultChecked} />
                  </div>
                ))}
              </div>
            </div>

            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700" onClick={handleSave}>
              <Save className="h-4 w-4" />
              Lưu cài đặt
            </Button>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100">
                  <Bell className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Cài đặt thông báo</h3>
                  <p className="text-xs text-muted-foreground">Quản lý các loại thông báo gửi tới admin và khách hàng</p>
                </div>
              </div>
              {[
                { label: "Đơn mới chờ xử lý", desc: "Nhận âm thanh + thông báo khi có đơn pending mới", defaultChecked: true, badge: "Real-time" },
                { label: "Đơn hủy", desc: "Thông báo khi khách hàng hủy đơn", defaultChecked: true, badge: null },
                { label: "Đánh giá mới", desc: "Thông báo khi có review mới cho tour", defaultChecked: false, badge: null },
                { label: "Báo cáo hàng ngày", desc: "Email tổng hợp doanh thu và đơn hàng cuối ngày", defaultChecked: true, badge: "Email" },
                { label: "Cảnh báo hệ thống", desc: "Thông báo khi có lỗi nghiêm trọng", defaultChecked: true, badge: "Quan trọng" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{item.label}</p>
                        {item.badge && (
                          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <Switch defaultChecked={item.defaultChecked} />
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100">
                  <Shield className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Bảo mật hệ thống</h3>
                  <p className="text-xs text-muted-foreground">Cấu hình bảo mật tài khoản quản trị</p>
                </div>
              </div>
              {[
                { label: "Xác thực 2 yếu tố (2FA)", desc: "Yêu cầu mã OTP khi đăng nhập", defaultChecked: false },
                { label: "Giới hạn đăng nhập", desc: "Khóa tài khoản sau 5 lần nhập sai mật khẩu", defaultChecked: true },
                { label: "Ghi log hoạt động", desc: "Lưu lại tất cả hoạt động của admin vào audit log", defaultChecked: true },
                { label: "Hết phiên tự động", desc: "Tự đăng xuất sau 8 tiếng không hoạt động", defaultChecked: true },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch defaultChecked={item.defaultChecked} />
                </div>
              ))}
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-600">Vùng nguy hiểm</p>
                <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 gap-2">
                  <Settings className="h-4 w-4" />
                  Xóa toàn bộ cache hệ thống
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
