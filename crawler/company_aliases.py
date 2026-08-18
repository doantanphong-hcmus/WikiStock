"""Bí danh doanh nghiệp đã được duyệt cho bộ nhận diện tin tức RSS."""


COMPANY_ALIASES = {
    "FPT": ("FPT Corporation", "Tập đoàn FPT", "FPT Software", "FPT Telecom"),
    "GAS": ("PV GAS", "Tổng công ty Khí Việt Nam"),
    "HPG": ("Tập đoàn Hòa Phát", "Hòa Phát"),
    "HSG": ("Tập đoàn Hoa Sen", "Hoa Sen Group"),
    "MWG": ("Thế Giới Di Động", "Mobile World", "Bách Hóa Xanh"),
    "SSI": ("Chứng khoán SSI", "SSI Securities"),
    "VCB": ("Vietcombank", "Ngân hàng Ngoại thương"),
    "VCG": ("Vinaconex", "Tổng công ty Vinaconex"),
    "VIC": ("Vingroup", "Tập đoàn Vingroup"),
    "VNM": ("Vinamilk", "Sữa Việt Nam"),
}

# Từ "mã" đứng riêng chưa đủ mạnh vì có thể là mã màu, mã thiết bị hoặc mã tệp.
FINANCIAL_CONTEXTS = (
    "cổ phiếu",
    "chứng khoán",
    "HOSE",
    "HNX",
    "UPCoM",
    "đại hội cổ đông",
    "doanh thu",
    "lợi nhuận",
)
