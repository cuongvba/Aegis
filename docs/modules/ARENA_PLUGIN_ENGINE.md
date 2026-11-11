# 🧩 Phân Hệ Đấu Trường Gameshow (Arena Plugin Engine)

Tài liệu này cung cấp cái nhìn toàn cảnh về phân hệ **Đấu Trường Trí Tuệ (Aegis Arena)**, cơ chế cắm rút Plugin, phân luồng SignalR và bộ tổng hợp âm thanh Web Audio SFX.

---

## 1. Giới Thiệu Phân Hệ

Phân hệ Đấu trường được thiết kế nhằm mô phỏng và số hóa các gameshow truyền hình trí tuệ đỉnh cao cho học sinh, sinh viên và doanh nghiệp. Hệ thống giải quyết 3 thách thức lớn nhất của các ứng dụng gameshow online:
1. **Khả năng mở rộng không giới hạn (Extensibility)**: Không cần sửa đổi kiến trúc lõi khi thêm một gameshow mới (sử dụng `IArenaGamePlugin`).
2. **Độ trễ cướp chuông mili-giây (Microsecond Buzzer Latency)**: Xử lý tranh chấp bằng bộ nhớ RAM đa luồng `ConcurrentDictionary` kết hợp đồng hồ xung nhịp phần cứng `Stopwatch.GetTimestamp()`.
3. **Trải nghiệm nghe nhìn Studio sống động**: Tích hợp công nghệ Canvas 60fps mô phỏng nón quay vật lý và bộ tổng hợp âm thanh Web Audio API không có độ trễ tải mạng.

---

## 2. Kiến Trúc Cắm Rút Mở (Hot-Plug Architecture) & Các Mẫu Tích Hợp Sẵn

Aegis Arena vận hành theo nguyên lý **Open-Closed Principle (OCP)**: Lõi hệ thống đóng với việc sửa đổi nhưng mở vô hạn cho việc mở rộng.
- **6 Gameshow Tham Chiếu Kinh Điển (Built-in Reference Plugins)**:
  ```
  [Sảnh Đấu Trường: ArenaHubPage]
    ├── 🏛️ Olympia Supreme (4 Vòng, 4 Bục 3D, VCNV 80đ, Ngôi Sao Hy Vọng x2)
    ├── 🔔 Rung Chuông Vàng (Mega-Grid 100 Ghế Ma Trận, Bảng Mica, Thầy Cô Cứu Trợ)
    ├── 🎡 Chiếc Nón Kỳ Diệu (Vòng Quay Canvas 60fps Quán Tính, Lật Ô Chữ 3D)
    ├── 🎓 University Challenge (Đối Kháng 4v4 Liên Trường, Starter 10đ, Bonus 15đ)
    ├── 🇺🇸 Jeopardy! American Matrix (30 Ô Ma Trận Điểm, Quy Tắc Câu Hỏi Ngược)
    └── ⚡ Nhanh Như Chớp (Thang Leo Dốc 10 Bậc, Đúng Lên 1, Sai Tụt Về 0)
  ```
- **Hệ Động Cơ Cắm Nóng `DynamicArenaGamePlugin` (No-Code Hot-Plug Engine)**:
  - Cho phép giáo viên mọi cấp học (kể cả mầm non) tự tạo ra các thể thức gameshow hoàn toàn mới thông qua **Arena Studio** (`/arena/studio`).
  - Khi một template gameshow được xuất bản, `ArenaRoomManager` tự động bọc thành một instance của `DynamicArenaGamePlugin` và cắm nóng vào bộ điều phối phòng mà **không cần khởi động lại ứng dụng hay biên dịch lại mã nguồn**.
  - Các thể thức mẫu động đã được cấu hình sẵn trong `_dynamicTemplates`:
    - 🏆 *Ai Là Triệu Phú (`TRIEU_PHU_AI`)*
    - 🔥 *Kẻ Săn Mồi (`THE_CHASE`)*
    - 🧩 *Đuổi Hình Bắt Chữ (`DUOI_HINH_BAT_CHU`)*
    - 👥 *Đấu Trí 1 vs 100 (`DAU_TRI_100`)*
    - 🐻 *Các Gameshow lớp học tự tạo của Giáo viên*

Chi tiết mã nguồn của các plugin được đặt tại:
- Backend: [`ArenaGamePlugins.cs`](file:///d:/Cuong/DuAn/mybank/AegisGlobal/Backend/src/Aegis.Infrastructure/Arena/ArenaGamePlugins.cs) & [`DynamicArenaGamePlugin.cs`](file:///d:/Cuong/DuAn/mybank/AegisGlobal/Backend/src/Aegis.Infrastructure/Arena/DynamicArenaGamePlugin.cs)
- Frontend: [`DynamicUniversalArenaView.tsx`](file:///d:/Cuong/DuAn/mybank/AegisGlobal/Frontend/src/pages/arena/components/DynamicUniversalArenaView.tsx) & [`ArenaStudioPage.tsx`](file:///d:/Cuong/DuAn/mybank/AegisGlobal/Frontend/src/pages/arena/ArenaStudioPage.tsx)
- Cẩm nang hướng dẫn giáo viên: [`TEACHER_ARENA_GAMESHOW_STUDIO_GUIDE.md`](file:///d:/Cuong/DuAn/mybank/AegisGlobal/docs/manuals/TEACHER_ARENA_GAMESHOW_STUDIO_GUIDE.md)

---

## 3. Kiến Trúc Bộ Điều Phối Phòng (`ArenaRoomManager`)

`ArenaRoomManager` là Singleton Service duy trì trạng thái của tất cả các phòng thi đấu đang diễn ra:

```csharp
public class ArenaRoomManager
{
    private readonly ConcurrentDictionary<string, ArenaRoomState> _rooms = new();
    private readonly Dictionary<string, IArenaGamePlugin> _plugins = new();

    public ArenaRoomManager(IEnumerable<IArenaGamePlugin> plugins)
    {
        foreach (var p in plugins)
        {
            _plugins[p.GameCode] = p;
        }
    }

    public ArenaRoomState CreateRoom(string gameCode, string roomName, string hostUserId)
    {
        if (!_plugins.TryGetValue(gameCode, out var plugin))
            throw new ArgumentException($"Game plugin '{gameCode}' không tồn tại.");

        var roomId = Guid.NewGuid().ToString("N")[..6].ToUpperInvariant();
        var state = plugin.InitializeRoomState(roomId, roomName, hostUserId);
        _rooms[roomId] = state;
        return state;
    }
}
```

---

## 4. Hướng Dẫn Phát Triển Chi Tiết

Để tìm hiểu chi tiết các bước tạo mới một gameshow từ A đến Z, xem hướng dẫn kỹ thuật viên đầy đủ tại:
👉 **[Tài Liệu Kỹ Thuật Viên: Arena Plugin Developer Guide](../ARENA_PLUGIN_DEVELOPER_GUIDE.md)**
