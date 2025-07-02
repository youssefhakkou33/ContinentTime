from datetime import datetime
import PySimpleGUI as sg

class ContinentTimeApp:
    def __init__(self):
        sg.theme('LightBlue3') # Set a theme for the GUI

        # Define the layout of the GUI
        self.layout = [] # This will be populated by create_widgets
        self.window = None # Will hold the PySimpleGUI window object

        self.continent_data = {} # Stores {year: {continent: [(start_date, end_date)]}}

        self.create_widgets()

    def create_widgets(self):
        # Input Frame
        input_frame = ttk.LabelFrame(self.root, text="Add Stay Information")
        input_frame.pack(padx=10, pady=10, fill="x")

        # Year Input
        ttk.Label(input_frame, text="Year:").grid(row=0, column=0, padx=5, pady=5, sticky="w")
        self.year_entry = ttk.Entry(input_frame, width=10)
        self.year_entry.grid(row=0, column=1, padx=5, pady=5, sticky="ew")
        self.year_entry.insert(0, str(datetime.now().year))

        # Continent Input
        ttk.Label(input_frame, text="Continent:").grid(row=1, column=0, padx=5, pady=5, sticky="w")
        self.continent_combobox = ttk.Combobox(input_frame, values=["Africa", "Antarctica", "Asia", "Europe", "North America", "Oceania", "South America"], state="readonly")
        self.continent_combobox.grid(row=1, column=1, padx=5, pady=5, sticky="ew")
        self.continent_combobox.set("Europe") # Default value

        # Start Date Input
        ttk.Label(input_frame, text="Start Date (YYYY-MM-DD):").grid(row=2, column=0, padx=5, pady=5, sticky="w")
        self.start_date_entry = ttk.Entry(input_frame, width=20)
        self.start_date_entry.grid(row=2, column=1, padx=5, pady=5, sticky="ew")