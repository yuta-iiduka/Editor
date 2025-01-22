import tkinter as tk
from tkinter import messagebox

class GUI:
    def __init__(self,title,w,h):
        self.root = tk.Tk()
        self.root.title(title)
        self.root.geometry("{}x{}".format(w,h))
        self.root.resizable(False,False)
        self.explanation = tk.Frame(self.root)
        self.explanation.pack(expand=True)
        self.frame = tk.Frame(self.root)
        self.frame.pack(expand=True)

    
    def label(self, text):
        lbl = tk.Label(self.explanation, text=text)
        lbl.pack(pady=5)
    
    def message(self, text):
        lbl = tk.Label(self.root, text=text)
        lbl.pack(pady=5)

    def button(self, text, func):
        btn = tk.Button(self.frame, text=text, command=func)
        btn.pack(side=tk.LEFT,pady=10)

    def icon(self, file_path):
        img = tk.PhotoImage(file=file_path)
        self.root.iconphoto(False, img)

    def start(self):
        self.root.mainloop()

