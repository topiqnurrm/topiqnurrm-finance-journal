import tkinter as tk
from tkinter import messagebox
from tkinter import ttk
import networkx as nx
import matplotlib.pyplot as plt
import pickle
import os

class Transaksi:
    def __init__(self, keterangan, jumlah):
        self.keterangan = keterangan
        self.jumlah = jumlah
        self.selanjutnya = None
        self.sebelumnya = None
        self.anak = []

    def tambah_anak(self, transaksi):
        self.anak.append(transaksi)


class MenabungUangGUI:
    def __init__(self):
        self.pengguna = []
        self.antrean_transaksi = []  # Antrean
        self.tumpukan_transaksi = []  # Tumpukan

    def simpan_data(self, path):
        data = {
            "pengguna": self.pengguna,
            "antrean_transaksi": self.antrean_transaksi,
            "tumpukan_transaksi": self.tumpukan_transaksi
        }
        path = r"D:/KULIAH PTI ANGKATAN 22/1. KELAS/SEMESTER 2/1. KULIAH/2.3. Praktik Struktur Data (Bu Aksin)/16. projek akhir/data bank/data.pickle"
        with open(path, "wb") as file:
            pickle.dump(data, file)
        messagebox.showinfo("Simpan Data", "Data berhasil disimpan.")

    def muat_data(self, path):
        path = r"D:/KULIAH PTI ANGKATAN 22/1. KELAS/SEMESTER 2/1. KULIAH/2.3. Praktik Struktur Data (Bu Aksin)/16. projek akhir/data bank/data.pickle"
        with open(path, "rb") as file:
            data = pickle.load(file)
            self.pengguna = data["pengguna"]
            self.antrean_transaksi = data["antrean_transaksi"]
            self.tumpukan_transaksi = data["tumpukan_transaksi"]
        messagebox.showinfo("Muat Data", "Data berhasil dimuat.")

    def reset_data(self):
        confirm = messagebox.askyesno("Konfirmasi Reset Data", "Apakah Anda yakin ingin mereset data Bank Kita?")
        if confirm:
            data_path = "D:/KULIAH PTI ANGKATAN 22/1. KELAS/SEMESTER 2/1. KULIAH/2.3. Praktik Struktur Data (Bu Aksin)/16. projek akhir/data bank/data.pickle"
            if os.path.exists(data_path):
                os.remove(data_path)
                self.pengguna = []
                self.antrean_transaksi = []  # Antrean
                self.tumpukan_transaksi = []  # Tumpukan

                with open(data_path, "wb") as file:
                    pickle.dump((self.pengguna, self.antrean_transaksi, self.tumpukan_transaksi), file)

                messagebox.showinfo("Reset Data", "Data berhasil direset.")
            else:
                messagebox.showwarning("File Tidak Ditemukan", "Data file tidak ditemukan.")


    def tambah_pengguna(self, nama_pengguna):
        for pengguna in self.pengguna:
            if pengguna["nama_pengguna"] == nama_pengguna:
                messagebox.showerror(
                    "Error", f"Pengguna dengan nama {nama_pengguna} sudah ada.")
                return
        self.pengguna.append({
            "nama_pengguna": nama_pengguna,
            "saldo": 0,
            "riwayat": None
        })
        messagebox.showinfo(
            "Tambah Pengguna", f"Pengguna dengan nama {nama_pengguna} berhasil ditambahkan.")

    def tampilkan_semua_pengguna(self):
        pengguna_string = ""
        for pengguna in self.pengguna:
            nama_pengguna = pengguna["nama_pengguna"]
            saldo = pengguna["saldo"]
            pengguna_string += f"Nama Pengguna: {nama_pengguna}, Saldo: {saldo}\n"
        messagebox.showinfo("Daftar Pengguna", pengguna_string)

    def lihat_saldo(self, nama_pengguna):
        pengguna = self.get_pengguna(nama_pengguna)
        if pengguna:
            saldo = pengguna["saldo"]
            messagebox.showinfo("Saldo", f"Saldo {nama_pengguna}: {saldo}")
        else:
            messagebox.showerror(
                "Error", f"Pengguna dengan nama {nama_pengguna} tidak ditemukan.")

    def tambah_uang(self, nama_pengguna, jumlah, keterangan):
        pengguna = self.get_pengguna(nama_pengguna)
        if pengguna:
            pengguna["saldo"] += jumlah
            transaksi = Transaksi(keterangan, jumlah)
            self.tambah_transaksi_ke_riwayat(pengguna, transaksi)
            messagebox.showinfo(
                "Tambah Uang", f"Uang sebesar {jumlah} berhasil ditambahkan ke dalam tabungan {nama_pengguna}.")
            # Masukkan transaksi ke dalam antrean
            self.antrean_transaksi.append(transaksi)
        else:
            messagebox.showerror(
                "Error", f"Pengguna dengan nama {nama_pengguna} tidak ditemukan.")

    def ambil_uang(self, nama_pengguna, jumlah, keterangan):
        pengguna = self.get_pengguna(nama_pengguna)
        if pengguna:
            if jumlah > pengguna["saldo"]:
                messagebox.showerror("Error", "Maaf, saldo tidak cukup.")
            else:
                pengguna["saldo"] -= jumlah
                transaksi = Transaksi(keterangan, -jumlah)
                self.tambah_transaksi_ke_riwayat(pengguna, transaksi)
                messagebox.showinfo(
                    "Ambil Uang", f"Uang sebesar {jumlah} berhasil diambil dari tabungan {nama_pengguna}.")
                # Dorong transaksi ke dalam tumpukan
                self.tumpukan_transaksi.append(transaksi)
        else:
            messagebox.showerror(
                "Error", f"Pengguna dengan nama {nama_pengguna} tidak ditemukan.")

    def transfer_uang(self, pengirim, penerima, jumlah, keterangan):
        pengguna_pengirim = self.get_pengguna(pengirim)
        pengguna_penerima = self.get_pengguna(penerima)
        if pengguna_pengirim and pengguna_penerima:
            if jumlah > pengguna_pengirim["saldo"]:
                messagebox.showerror("Error", "Maaf, saldo tidak cukup.")
            else:
                pengguna_pengirim["saldo"] -= jumlah
                pengguna_penerima["saldo"] += jumlah
                transaksi = Transaksi(keterangan, -jumlah)
                self.tambah_transaksi_ke_riwayat(pengguna_pengirim, transaksi)
                messagebox.showinfo(
                    "Transfer Uang", f"Transfer uang sebesar {jumlah} dari {pengirim} ke {penerima} berhasil.")
                # Dorong transaksi ke dalam tumpukan
                self.tumpukan_transaksi.append(transaksi)
        else:
            messagebox.showerror(
                "Error", "Pengguna pengirim atau penerima tidak ditemukan.")

    def tampilkan_riwayat_transaksi(self, nama_pengguna):
        pengguna = self.get_pengguna(nama_pengguna)
        if pengguna:
            riwayat = pengguna["riwayat"]
            if riwayat:
                riwayat_string = self.get_riwayat_string(riwayat)
                messagebox.showinfo("Riwayat Transaksi", riwayat_string)
            else:
                messagebox.showinfo("Riwayat Transaksi",
                                    "Riwayat transaksi kosong.")
        else:
            messagebox.showerror(
                "Error", f"Pengguna dengan nama {nama_pengguna} tidak ditemukan.")

    def get_riwayat_string(self, transaksi, level=0):
        prefix = "  " * level
        riwayat_string = f"{prefix}Transaksi: {transaksi.keterangan}, Jumlah: {transaksi.jumlah}\n"
        for anak in transaksi.anak:
            riwayat_string += self.get_riwayat_string(anak, level + 1)
        return riwayat_string

    def tampilkan_riwayat_transaksi_helper(self, transaksi, level):
        prefix = " " * level
        keterangan = transaksi.keterangan
        jumlah = transaksi.jumlah
        print(f"{prefix}Transaksi: {keterangan}, Jumlah: {jumlah}")
        for anak in transaksi.anak:
            self.tampilkan_riwayat_transaksi_helper(anak, level + 1)

    def tambah_transaksi_ke_riwayat(self, pengguna, transaksi):
        if not pengguna["riwayat"]:
            pengguna["riwayat"] = transaksi
        else:
            current = pengguna["riwayat"]
            while current.selanjutnya:
                current = current.selanjutnya
            current.tambah_anak(transaksi)
            transaksi.sebelumnya = current

    def get_pengguna(self, nama_pengguna):
        for pengguna in self.pengguna:
            if pengguna["nama_pengguna"] == nama_pengguna:
                return pengguna
        return None

    def tampilkan_graf_transaksi(self):
        # Buat graf kosong
        G = nx.DiGraph()

        # Rekursif untuk menambahkan node dan edge ke graf
        def tambahkan_node_dan_edge(transaksi, parent=None):
            if parent is None:
                node_label = transaksi.keterangan
            else:
                node_label = f"{parent} - {transaksi.keterangan}"
            G.add_node(node_label)

            if parent is not None:
                G.add_edge(parent, node_label)

            for anak in transaksi.anak:
                tambahkan_node_dan_edge(anak, parent=node_label)

        # Tambahkan node dan edge ke graf
        for transaksi in self.antrean_transaksi:
            tambahkan_node_dan_edge(transaksi)

        # Gambar graf
        pos = nx.spring_layout(G, seed=42)
        plt.figure(figsize=(8, 6))
        nx.draw_networkx(G, pos, with_labels=True, node_size=1000,
                         node_color='lightblue', edge_color='gray', font_size=8)
        plt.title('Graf Transaksi')
        plt.show()

    def tampilkan_tree(self):
        # Buat window baru
        tree_window = tk.Toplevel()
        tree_window.title("Tree View")
        tree_window.geometry("400x400")

        # Buat tree view dan tambahkan kolom
        tree_view = ttk.Treeview(tree_window)
        tree_view["columns"] = ("keterangan", "jumlah")

        # Set header kolom
        tree_view.heading("#0", text="Transaksi")
        tree_view.heading("keterangan", text="Keterangan")
        tree_view.heading("jumlah", text="Jumlah")

        # Menambahkan item ke tree view
        for transaksi in self.antrean_transaksi:
            parent = ""
            self.tampilkan_transaksi_helper(transaksi, parent, tree_view)

        # Menampilkan tree view
        tree_view.pack()

    def tampilkan_transaksi_helper(self, transaksi, parent, tree_view):
        # Menambahkan item transaksi ke tree view
        item_id = tree_view.insert(parent, "end", text=transaksi.keterangan)
        tree_view.set(item_id, "keterangan", transaksi.keterangan)
        tree_view.set(item_id, "jumlah", transaksi.jumlah)

        # Menambahkan anak-anak transaksi jika ada
        for anak in transaksi.anak:
            self.tampilkan_transaksi_helper(anak, item_id, tree_view)


class GUI:
    def __init__(self, menabunguangui):
        self.menabunguangui = menabunguangui

        self.window = tk.Tk()
        self.window.title("Bank Kita")
        self.window.geometry("600x400")

        # Bagian 1
        self.frame1 = tk.Frame(self.window, padx=10, pady=10)
        self.frame1.grid(row=0, column=0, sticky="nsew")
        self.label_nama_pengguna = tk.Label(
            self.frame1, text="Nama Pengguna:")
        self.label_nama_pengguna.pack()
        self.entry_nama_pengguna = tk.Entry(self.frame1)
        self.entry_nama_pengguna.pack()
        self.button_tambah_pengguna = tk.Button(
            self.frame1, text="Tambah Pengguna", command=self.tambah_pengguna)
        self.button_tambah_pengguna.pack()
        self.button_lihat_saldo = tk.Button(
            self.frame1, text="Lihat Saldo", command=self.lihat_saldo)
        self.button_lihat_saldo.pack()
        self.button_tampilkan_riwayat = tk.Button(
            self.frame1, text="Tampilkan Riwayat", command=self.tampilkan_riwayat)
        self.button_tampilkan_riwayat.pack()

        # Bagian 2
        self.frame2 = tk.Frame(self.window, padx=10, pady=10)
        self.frame2.grid(row=0, column=1, sticky="nsew")
        self.label_nama_pengguna2 = tk.Label(
            self.frame2, text="Nama Pengguna:")
        self.label_nama_pengguna2.pack()
        self.entry_nama_pengguna2 = tk.Entry(self.frame2)
        self.entry_nama_pengguna2.pack()
        self.label_jumlah_uang = tk.Label(self.frame2, text="Jumlah Uang:")
        self.label_jumlah_uang.pack()
        self.entry_jumlah_uang = tk.Entry(self.frame2)
        self.entry_jumlah_uang.pack()
        self.label_keterangan = tk.Label(self.frame2, text="Keterangan:")
        self.label_keterangan.pack()
        self.entry_keterangan = tk.Entry(self.frame2)
        self.entry_keterangan.pack()
        self.button_tambah_uang = tk.Button(
            self.frame2, text="Tambah Uang", command=self.tambah_uang)
        self.button_tambah_uang.pack()
        self.button_ambil_uang = tk.Button(
            self.frame2, text="Ambil Uang", command=self.ambil_uang)
        self.button_ambil_uang.pack()

        # Bagian 3
        self.frame3 = tk.Frame(self.window, padx=10, pady=10)
        self.frame3.grid(row=0, column=2, sticky="nsew")
        self.label_pengirim = tk.Label(self.frame3, text="Pengirim:")
        self.label_pengirim.pack()
        self.entry_pengirim = tk.Entry(self.frame3)
        self.entry_pengirim.pack()
        self.label_penerima = tk.Label(self.frame3, text="Penerima:")
        self.label_penerima.pack()
        self.entry_penerima = tk.Entry(self.frame3)
        self.entry_penerima.pack()
        self.label_jumlah_transfer = tk.Label(
            self.frame3, text="Jumlah Transfer:")
        self.label_jumlah_transfer.pack()
        self.entry_jumlah_transfer = tk.Entry(self.frame3)
        self.entry_jumlah_transfer.pack()
        self.label_keterangan_transfer = tk.Label(
            self.frame3, text="Keterangan Transfer:")
        self.label_keterangan_transfer.pack()
        self.entry_keterangan_transfer = tk.Entry(self.frame3)
        self.entry_keterangan_transfer.pack()
        self.button_transfer_uang = tk.Button(
            self.frame3, text="Transfer Uang", command=self.transfer_uang)
        self.button_transfer_uang.pack()

        # Bagian 4
        self.frame4 = tk.Frame(self.window, padx=10, pady=10)
        self.frame4.grid(row=0, column=4, sticky="nsew")
        self.button_tampilkan_semua_pengguna = tk.Button(
            self.frame4, text="Tampilkan Semua Pengguna & saldonya", command=self.tampilkan_semua_pengguna)
        self.button_tampilkan_semua_pengguna.pack()
        self.button_tampilkan_graf = tk.Button(
            self.frame4, text="Tampilkan Graf Transaksi", command=self.tampilkan_graf_transaksi)
        self.button_tampilkan_graf.pack()
        self.button_tampilkan_tree = tk.Button(
            self.frame4, text="Tampilkan Tree", command=self.tampilkan_tree)
        self.button_tampilkan_tree.pack()

        # bagian 5
        self.frame5 = tk.Frame(self.window, padx=10, pady=10)
        self.frame5.grid(row=0, column=8, sticky="nsew")
        self.button_reset_data = tk.Button(
            self.frame5, text="Reset Data", command=self.reset_data)
        self.button_reset_data.pack()


        self.window.mainloop()

    def tambah_pengguna(self):
        nama_pengguna = self.entry_nama_pengguna.get()
        if nama_pengguna:
            self.menabunguangui.tambah_pengguna(nama_pengguna)
            self.entry_nama_pengguna.delete(0, tk.END)
        else:
            messagebox.showerror(
                "Error", "Mohon masukkan nama pengguna.")

    def tampilkan_semua_pengguna(self):
        self.menabunguangui.tampilkan_semua_pengguna()

    def lihat_saldo(self):
        nama_pengguna = self.entry_nama_pengguna.get()
        if nama_pengguna:
            self.menabunguangui.lihat_saldo(nama_pengguna)
            self.entry_nama_pengguna.delete(0, tk.END)
        else:
            messagebox.showerror(
                "Error", "Mohon masukkan nama pengguna.")

    def tambah_uang(self):
        nama_pengguna = self.entry_nama_pengguna2.get()
        jumlah_uang = int(self.entry_jumlah_uang.get())
        keterangan = self.entry_keterangan.get()
        if nama_pengguna and jumlah_uang and keterangan:
            self.menabunguangui.tambah_uang(
                nama_pengguna, jumlah_uang, keterangan)
            self.entry_nama_pengguna2.delete(0, tk.END)
            self.entry_jumlah_uang.delete(0, tk.END)
            self.entry_keterangan.delete(0, tk.END)
        else:
            messagebox.showerror(
                "Error", "Mohon masukkan semua informasi.")

    def ambil_uang(self):
        nama_pengguna = self.entry_nama_pengguna2.get()
        jumlah_uang = int(self.entry_jumlah_uang.get())
        keterangan = self.entry_keterangan.get()
        if nama_pengguna and jumlah_uang and keterangan:
            self.menabunguangui.ambil_uang(
                nama_pengguna, jumlah_uang, keterangan)
            self.entry_nama_pengguna2.delete(0, tk.END)
            self.entry_jumlah_uang.delete(0, tk.END)
            self.entry_keterangan.delete(0, tk.END)
        else:
            messagebox.showerror(
                "Error", "Mohon masukkan semua informasi.")

    def transfer_uang(self):
        pengirim = self.entry_pengirim.get()
        penerima = self.entry_penerima.get()
        jumlah_transfer = int(self.entry_jumlah_transfer.get())
        keterangan_transfer = self.entry_keterangan_transfer.get()
        if pengirim and penerima and jumlah_transfer and keterangan_transfer:
            self.menabunguangui.transfer_uang(
                pengirim, penerima, jumlah_transfer, keterangan_transfer)
            self.entry_pengirim.delete(0, tk.END)
            self.entry_penerima.delete(0, tk.END)
            self.entry_jumlah_transfer.delete(0, tk.END)
            self.entry_keterangan_transfer.delete(0, tk.END)
        else:
            messagebox.showerror("Error", "Harap isi semua field!")

    def tampilkan_riwayat(self):
        nama_pengguna = self.entry_nama_pengguna.get()
        if nama_pengguna:
            self.menabunguangui.tampilkan_riwayat_transaksi(nama_pengguna)
            self.entry_nama_pengguna.delete(0, tk.END)
        else:
            messagebox.showerror(
                "Error", "Mohon masukkan nama pengguna.")

    def tampilkan_graf_transaksi(self):
        self.menabunguangui.tampilkan_graf_transaksi()

    def tampilkan_tree(self):
        self.menabunguangui.tampilkan_tree()

    def reset_data(self):
        self.menabunguangui.reset_data()


menabunguangui = MenabungUangGUI()
menabunguangui.muat_data(
    "D:/KULIAH PTI ANGKATAN 22/1. KELAS/SEMESTER 2/1. KULIAH/2.3. Praktik Struktur Data(Bu Aksin)/16. projek akhir/data bank/data.pickle")
gui = GUI(menabunguangui)
menabunguangui.simpan_data(
    "D:/KULIAH PTI ANGKATAN 22/1. KELAS/SEMESTER 2/1. KULIAH/2.3. Praktik Struktur Data(Bu Aksin)/16. projek akhir/data bank/data.pickle")
